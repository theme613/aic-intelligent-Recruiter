/**
 * Step 2.5 — GitHub enrichment & trust signal generation.
 *
 * Extracts GitHub (and other profile) URLs from resume text,
 * fetches the GitHub REST API (public, no auth needed, 60 req/hr),
 * and produces trust signals by cross-referencing claimed skills
 * against real repo data.
 *
 * Never throws — all failures return null / empty signals so the
 * rest of the pipeline is not affected.
 */

import type { Candidate, GitHubProfile, GitHubRepo, TrustSignal } from "./types";

// ── URL extraction ────────────────────────────────────────────────────────

const GITHUB_URL_RE =
  /github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})/gi;

const LINKEDIN_RE = /linkedin\.com\/in\/([a-zA-Z0-9_%-]+)/i;

/** Pages / orgs on github.com that are not user profiles */
const GITHUB_NON_USERS = new Set([
  "apps", "orgs", "marketplace", "features", "pricing",
  "about", "contact", "login", "join", "topics", "explore",
  "trending", "sponsors", "settings", "notifications",
]);

export function extractGitHubLogin(text: string): string | null {
  const seen = new Set<string>();
  for (const m of text.matchAll(GITHUB_URL_RE)) {
    const login = m[1].replace(/\/$/, "").split("/")[0];
    if (!GITHUB_NON_USERS.has(login.toLowerCase()) && !seen.has(login)) {
      seen.add(login);
      return login; // return first valid one
    }
  }
  return null;
}

export type ProfileUrls = {
  github?: string;
  linkedin?: string;
  portfolio?: string;
  otherUrls: string[];
};

export function extractProfileUrls(text: string): ProfileUrls {
  const linkedinMatch = text.match(LINKEDIN_RE);
  const linkedin = linkedinMatch
    ? `https://linkedin.com/in/${linkedinMatch[1]}`
    : undefined;

  const githubLogin = extractGitHubLogin(text);
  const github = githubLogin ? `https://github.com/${githubLogin}` : undefined;

  const urlRe = /https?:\/\/[^\s)>,\]"']+/g;
  const allUrls = [...text.matchAll(urlRe)].map((m) => m[0]);
  const otherUrls = allUrls.filter(
    (u) => !u.includes("github.com") && !u.includes("linkedin.com"),
  );
  const portfolio = otherUrls.find(
    (u) => !u.includes("mailto:") && !u.includes("twitter.com"),
  );

  return { github, linkedin, portfolio, otherUrls };
}

// ── GitHub API ────────────────────────────────────────────────────────────

async function apiFetch(url: string, timeoutMs = 5000): Promise<unknown | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

interface RawGHUser {
  login: string;
  name?: string;
  bio?: string;
  public_repos?: number;
  followers?: number;
}

interface RawGHRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  topics?: string[];
  pushed_at: string;
  fork: boolean;
}

export async function fetchGitHubProfile(
  login: string,
): Promise<GitHubProfile | null> {
  const [user, repos] = await Promise.all([
    apiFetch(`https://api.github.com/users/${login}`),
    apiFetch(
      `https://api.github.com/users/${login}/repos?sort=pushed&per_page=30&type=owner`,
    ),
  ]);

  if (!user || !repos || !Array.isArray(repos)) return null;

  const u = user as RawGHUser;
  const rawRepos = (repos as RawGHRepo[]).filter((r) => !r.fork);

  // Language frequency across own repos
  const langCount: Record<string, number> = {};
  for (const r of rawRepos) {
    if (r.language) langCount[r.language] = (langCount[r.language] ?? 0) + 1;
  }
  const topLanguages = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);

  // Top repos by stars, capped at 5
  const topRepos: GitHubRepo[] = rawRepos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5)
    .map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      url: r.html_url,
      topics: r.topics ?? [],
      updatedAt: r.pushed_at,
    }));

  const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;
  const recentlyActive = rawRepos.some(
    (r) => new Date(r.pushed_at).getTime() > sixMonthsAgo,
  );

  return {
    login,
    url: `https://github.com/${login}`,
    name: u.name ?? null,
    bio: u.bio ?? null,
    publicRepos: u.public_repos ?? 0,
    followers: u.followers ?? 0,
    topRepos,
    topLanguages,
    recentlyActive,
  };
}

// ── Trust signal generation ───────────────────────────────────────────────

/** Skill name → GitHub language(s) it typically appears as */
const SKILL_TO_LANG: Record<string, string[]> = {
  javascript: ["JavaScript", "TypeScript"],
  typescript: ["TypeScript", "JavaScript"],
  python: ["Python"],
  react: ["JavaScript", "TypeScript"],
  "next.js": ["JavaScript", "TypeScript"],
  nextjs: ["JavaScript", "TypeScript"],
  vue: ["JavaScript", "TypeScript", "Vue"],
  angular: ["JavaScript", "TypeScript"],
  java: ["Java", "Kotlin"],
  kotlin: ["Kotlin", "Java"],
  swift: ["Swift"],
  go: ["Go"],
  rust: ["Rust"],
  "c#": ["C#"],
  php: ["PHP"],
  ruby: ["Ruby"],
  "c++": ["C++"],
  css: ["CSS", "SCSS"],
  scss: ["SCSS", "CSS"],
  tailwind: ["CSS", "JavaScript", "TypeScript"],
  "tailwind css": ["CSS", "JavaScript", "TypeScript"],
  dart: ["Dart"],
  flutter: ["Dart"],
  "node.js": ["JavaScript", "TypeScript"],
  nodejs: ["JavaScript", "TypeScript"],
  svelte: ["Svelte", "JavaScript", "TypeScript"],
  "graphql": ["JavaScript", "TypeScript"],
  shell: ["Shell"],
  bash: ["Shell"],
};

export function generateTrustSignals(
  candidate: Pick<Candidate, "skills" | "name">,
  github: GitHubProfile | null,
  urls: ProfileUrls,
): TrustSignal[] {
  const signals: TrustSignal[] = [];

  // ── No GitHub ─────────────────────────────────────────────────────────
  if (!github) {
    signals.push({
      status: "unverified",
      label: "No public GitHub found",
      detail: "Skills and experience are self-reported only — no public code to verify.",
    });

    if (urls.linkedin) {
      signals.push({
        status: "partial",
        label: "LinkedIn provided",
        detail: "Employment history requires manual verification.",
        url: urls.linkedin,
      });
    }
    if (urls.portfolio) {
      signals.push({
        status: "partial",
        label: "Portfolio link found",
        detail: "Visit portfolio to assess project quality.",
        url: urls.portfolio,
      });
    }
    return signals;
  }

  // ── GitHub found ──────────────────────────────────────────────────────
  signals.push({
    status: "verified",
    label: `GitHub verified (${github.publicRepos} public repos)`,
    detail: `${github.followers} followers · ${github.recentlyActive ? "active in last 6 months" : "no recent public commits"}`,
    url: github.url,
  });

  // Activity
  if (!github.recentlyActive && github.publicRepos > 0) {
    signals.push({
      status: "partial",
      label: "Low recent activity",
      detail: "No public commits in 6+ months — may work primarily in private repos.",
      url: github.url,
    });
  }

  // Skill cross-check
  const ghLangs = github.topLanguages.map((l) => l.toLowerCase());
  const verified: string[] = [];
  const missing: string[] = [];

  for (const skill of candidate.skills.slice(0, 10)) {
    const langs = SKILL_TO_LANG[skill.toLowerCase()];
    if (!langs) continue;
    if (langs.some((l) => ghLangs.includes(l.toLowerCase()))) {
      verified.push(skill);
    } else {
      missing.push(skill);
    }
  }

  if (verified.length > 0) {
    signals.push({
      status: "verified",
      label: `${verified.length} skill${verified.length > 1 ? "s" : ""} confirmed via GitHub`,
      detail: `${verified.join(", ")} — matching repos found`,
      url: github.url,
    });
  }

  if (missing.length > 0 && verified.length === 0) {
    signals.push({
      status: "inconsistent",
      label: "Claimed skills absent from GitHub",
      detail: `${missing.slice(0, 4).join(", ")} not visible in public repos — ask for private work samples.`,
    });
  }

  // Top project
  if (github.topRepos.length > 0) {
    const top = github.topRepos[0];
    signals.push({
      status: "verified",
      label: `Top project: ${top.name}${top.stars ? ` ★${top.stars}` : ""}`,
      detail: top.description
        ? top.description.slice(0, 100)
        : `${top.language ?? "Code"} repository`,
      url: top.url,
    });
  }

  // LinkedIn
  if (urls.linkedin) {
    signals.push({
      status: "partial",
      label: "LinkedIn provided",
      detail: "Employment history requires manual verification.",
      url: urls.linkedin,
    });
  }

  // Portfolio
  if (urls.portfolio) {
    signals.push({
      status: "partial",
      label: "Portfolio link found",
      detail: "Visit to assess design / project quality.",
      url: urls.portfolio,
    });
  }

  return signals;
}

// ── Main enrichment function ──────────────────────────────────────────────

export async function enrichCandidate(candidate: Candidate): Promise<Candidate> {
  const urls = extractProfileUrls(candidate.raw_resume);
  const login = extractGitHubLogin(candidate.raw_resume);

  let github: GitHubProfile | null = null;
  if (login) {
    github = await fetchGitHubProfile(login);
  }

  const trustSignals = generateTrustSignals(candidate, github, urls);

  return { ...candidate, github, trustSignals, profileUrls: urls };
}

/** Enrich all candidates in parallel (non-blocking — failures degrade gracefully). */
export async function enrichCandidates(candidates: Candidate[]): Promise<Candidate[]> {
  return Promise.all(candidates.map((c) => enrichCandidate(c)));
}

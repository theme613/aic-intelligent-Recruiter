import type { JobRequirements } from "./types";

/** Words that alone should not count as a title match (too broad). */
const GENERIC_TITLE_WORDS = new Set([
  "engineer",
  "developer",
  "analyst",
  "specialist",
  "consultant",
  "lead",
  "senior",
  "junior",
  "staff",
  "principal",
  "associate",
  "manager",
  "director",
  "head",
  "intern",
  "graduate",
]);

/**
 * Whether a candidate title matches the JD role (title-bias detector).
 * Uses distinctive keywords first (e.g. "frontend" for Frontend Developer) so
 * "UI Engineer" or "Product Designer" does not false-match on "engineer" alone.
 */
export function computeTitleMatchFlag(
  currentTitle: string,
  titleKeywords: string[],
): boolean {
  if (!currentTitle.trim()) return false;
  if (titleKeywords.length === 0) return true;
  const t = currentTitle.toLowerCase();

  const distinctive = titleKeywords.filter(
    (kw) => !GENERIC_TITLE_WORDS.has(kw.toLowerCase().trim()),
  );

  const keywordsToCheck =
    distinctive.length > 0 ? distinctive : titleKeywords;

  return keywordsToCheck.some((kw) => {
    const k = kw.toLowerCase().trim();
    return k.length > 2 && t.includes(k);
  });
}

/**
 * Pull the title the candidate wrote on their resume (not the LLM's summary
 * interpretation). Hidden-gem detection depends on this being accurate.
 */
export function extractResumeHeadlineTitle(rawResume: string): string | null {
  const labeled = rawResume.match(
    /(?:current\s+title|present\s+role|position)\s*[:\n]+\s*([^\n]+)/i,
  );
  if (labeled?.[1]?.trim()) return labeled[1].trim();

  // "Senior Frontend Engineer — Acme (2021 – Present)"
  const roleDash = rawResume.match(
    /(?:^|\n)([A-Za-z][^\n]{4,70}?)\s*(?:—|–|-)\s*[A-Z][^\n(]{2,55}\s*\(\s*\d{4}/m,
  );
  if (roleDash?.[1]?.trim()) return roleDash[1].trim();

  return null;
}

/**
 * Conservative title-bias flag for hidden-gem detection.
 *
 * LLM parsers often copy aspirational text from the SUMMARY ("self-taught
 * full-stack developer") into `current_title`, which makes `title_match_flag`
 * true and kills hidden-gem detection. When the resume has an explicit
 * headline title that disagrees with the parsed title, BOTH must match the JD
 * for us to consider the title aligned.
 */
export function resolveTitleMatchFlag(
  parsedTitle: string,
  rawResume: string,
  titleKeywords: string[],
): boolean {
  const headline = extractResumeHeadlineTitle(rawResume);
  const parsedMatches = computeTitleMatchFlag(parsedTitle, titleKeywords);
  if (!headline) return parsedMatches;
  if (headline.toLowerCase().trim() === parsedTitle.toLowerCase().trim()) {
    return parsedMatches;
  }
  const headlineMatches = computeTitleMatchFlag(headline, titleKeywords);
  return parsedMatches && headlineMatches;
}

/** Derive title keywords from role title when the LLM omits them. */
export function deriveTitleKeywords(
  roleTitle: string,
  parsed?: string[],
): string[] {
  if (parsed && parsed.length > 0) {
    return parsed.map((k) => k.toLowerCase());
  }
  return roleTitle
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
}

/** Build punchy hidden-gem story from reason when LLM omits it. */
export function buildHiddenGemStory(
  currentTitle: string,
  reason: string,
  roleTitle: string,
): string {
  const titlePart = currentTitle.split(/[—–,-]/)[0]?.trim() || currentTitle;
  const rolePart =
    roleTitle.split(/\s+/).slice(-2).join(" ") || roleTitle;
  if (reason.toLowerCase().includes("title said")) {
    const match = reason.match(/title says?\s+([^,]+)/i);
    if (match) {
      return `Title said ${match[1].trim()}. Work said ${rolePart}. We promoted them.`;
    }
  }
  return `Title said ${titlePart}. Work said ${rolePart}. We promoted them.`;
}

export function countFlags(candidates: { flags: string[] }[]): number {
  return candidates.reduce((n, c) => n + c.flags.length, 0);
}

export function summarizeCandidate(c: {
  name: string;
  current_title: string;
  years_experience: number;
  skills: string[];
  top_projects: { title: string; summary: string; impact?: string }[];
  domain_exposure: string[];
  seniority_signals: string[];
  final_score: number;
  semantic_score: number;
  flags: string[];
  title_match_flag: boolean;
  potential_hidden_gem: boolean;
}) {
  return {
    name: c.name,
    title: c.current_title,
    title_match: c.title_match_flag,
    potential_hidden_gem: c.potential_hidden_gem,
    years: c.years_experience,
    skills: c.skills.slice(0, 12),
    projects: c.top_projects.map(
      (p) => `${p.title}: ${p.summary}${p.impact ? ` (${p.impact})` : ""}`,
    ),
    domain_exposure: c.domain_exposure,
    seniority_signals: c.seniority_signals.slice(0, 3),
    final_score: c.final_score,
    semantic_score: c.semantic_score,
    flags: c.flags,
  };
}

export function jdSummary(jd: JobRequirements) {
  return JSON.stringify(jd, null, 2);
}

import type { JobRequirements } from "./types";

/** Whether a candidate title contains any JD title keyword (title-bias detector). */
export function computeTitleMatchFlag(
  currentTitle: string,
  titleKeywords: string[],
): boolean {
  if (titleKeywords.length === 0) return true;
  const t = currentTitle.toLowerCase();
  return titleKeywords.some((kw) => {
    const k = kw.toLowerCase().trim();
    return k.length > 2 && t.includes(k);
  });
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

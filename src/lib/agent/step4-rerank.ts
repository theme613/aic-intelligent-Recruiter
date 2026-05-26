import type {
  JobRequirements,
  ScoredCandidate,
  SeniorityLevel,
} from "./types";
import { countFlags } from "./utils";

const SENIORITY_ORDER: SeniorityLevel[] = [
  "junior",
  "mid",
  "senior",
  "lead",
  "manager",
];

function seniorityFromTitle(
  title: string,
  years: number,
): SeniorityLevel {
  const t = title.toLowerCase();
  if (/(head|director|vp|chief|cto|cio|manager)/.test(t)) return "manager";
  if (/(lead|principal|staff)/.test(t)) return "lead";
  if (/(senior|sr\.)/.test(t) || years >= 6) return "senior";
  if (/(junior|jr\.|intern|graduate)/.test(t) || (years > 0 && years <= 2))
    return "junior";
  return "mid";
}

function impliedMinYears(level: SeniorityLevel): number {
  switch (level) {
    case "junior":
      return 0;
    case "mid":
      return 2;
    case "senior":
      return 5;
    case "lead":
      return 7;
    case "manager":
      return 8;
  }
}

function constraintIsSatisfied(
  constraint: string,
  haystack: string,
): boolean {
  const terms = constraint
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3);
  if (terms.length === 0) return true;
  return terms.some((t) => haystack.includes(t));
}

/**
 * STEP 4 — rule_based_rerank(candidates, jd) -> list[ScoredCandidate]
 * Pure TypeScript — no LLM.
 */
export function ruleBasedRerank(
  scored: ScoredCandidate[],
  jd: JobRequirements,
): ScoredCandidate[] {
  const reranked = scored.map((c) => {
    const flags = [...c.flags];

    let constraint_penalty = 0;
    const haystack = `${c.raw_resume} ${c.skills.join(" ")} ${c.domain_exposure.join(" ")}`.toLowerCase();
    for (const constraint of jd.hard_constraints) {
      if (!constraintIsSatisfied(constraint, haystack)) {
        constraint_penalty = -1000;
        flags.push(`constraint_missing:${constraint}`);
        break;
      }
    }

    const candLevel = seniorityFromTitle(c.current_title, c.years_experience);
    const jdIdx = SENIORITY_ORDER.indexOf(jd.seniority_level);
    const candIdx = SENIORITY_ORDER.indexOf(candLevel);
    const gap = Math.abs(jdIdx - candIdx);
    const seniority_score = Math.max(0, 100 - gap * 25);
    let seniority_penalty = 0;
    if (gap >= 2) {
      seniority_penalty = -15;
      flags.push("seniority_mismatch");
    }

    const targetDomain = jd.domain.toLowerCase();
    const domainMatched = c.domain_exposure.some(
      (d) => d.includes(targetDomain) || targetDomain.includes(d),
    );
    const domain_score = domainMatched ? 100 : 40;
    const domain_bonus = domainMatched ? 10 : 0;

    const minYears = impliedMinYears(jd.seniority_level);
    if (minYears > 0 && c.years_experience < minYears * 0.5) {
      flags.push("junior_risk");
    }

    const semanticPct = c.semantic_score * 100;

    // Weights: semantic 50%, seniority 25%, domain 25% → sum to 100
    // Then apply bonuses/penalties on top
    let final_score =
      semanticPct * 0.50 +
      seniority_score * 0.25 +
      domain_score * 0.25 +
      seniority_penalty +
      domain_bonus;

    if (constraint_penalty === -1000) {
      final_score = Math.min(55, final_score);
    }

    final_score = Math.max(0, Math.min(100, Math.round(final_score * 10) / 10));

    return {
      ...c,
      seniority_score,
      domain_score,
      domain_bonus,
      constraint_penalty,
      final_score,
      flags,
    };
  });

  return reranked.sort((a, b) => b.final_score - a.final_score);
}

export { countFlags };

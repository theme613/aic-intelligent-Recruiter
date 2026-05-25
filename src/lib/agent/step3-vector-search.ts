import { cosine, embedBatch } from "./embeddings";
import type { Candidate, JobRequirements, ScoredCandidate } from "./types";

const HIDDEN_GEM_SEMANTIC_THRESHOLD = 0.75;

function jdToQuery(jd: JobRequirements): string {
  return [
    jd.role_title,
    jd.seniority_level,
    jd.domain,
    ...jd.hard_skills,
    ...jd.responsibilities,
  ]
    .filter(Boolean)
    .join(" | ");
}

function candidateToDoc(c: Candidate): string {
  const projects = c.top_projects
    .map(
      (p) =>
        `${p.title}: ${p.summary}${p.impact ? ` (${p.impact})` : ""} [${p.stack.join(", ")}]`,
    )
    .join(" | ");
  return [
    c.current_title,
    `${c.years_experience}y experience`,
    ...c.skills,
    ...c.domain_exposure,
    ...c.seniority_signals,
    projects,
  ]
    .filter(Boolean)
    .join(" | ");
}

function toScored(
  c: Candidate,
  semantic_score: number,
  embeddingOk: boolean,
): ScoredCandidate {
  const potential_hidden_gem =
    !c.title_match_flag && semantic_score > HIDDEN_GEM_SEMANTIC_THRESHOLD;

  return {
    ...c,
    semantic_score,
    seniority_score: 50,
    domain_score: 0,
    domain_bonus: 0,
    constraint_penalty: 0,
    final_score: 0,
    flags: embeddingOk ? [] : ["embedding_failed"],
    potential_hidden_gem,
    is_hidden_gem: false,
    hidden_gem_reason: null,
    hidden_gem_story: null,
  };
}

/**
 * STEP 3 — vector_search(jd, candidates) -> list[ScoredCandidate]
 * Model: text-embedding-004 · retrieval_query / retrieval_document
 */
export async function vectorSearch(
  jd: JobRequirements,
  candidates: Candidate[],
): Promise<ScoredCandidate[]> {
  if (candidates.length === 0) return [];

  const query = jdToQuery(jd);
  const docs = candidates.map(candidateToDoc);

  let queryVec: number[] | null = null;
  let docVecs: number[][] = [];

  try {
    const [q, d] = await Promise.all([
      embedBatch([query], "RETRIEVAL_QUERY"),
      embedBatch(docs, "RETRIEVAL_DOCUMENT"),
    ]);
    queryVec = q[0] ?? null;
    docVecs = d;
  } catch (err) {
    console.error("[agent.step3] embedding failed:", err);
  }

  const scored = candidates.map((c, i) => {
    const semantic =
      queryVec && docVecs[i] ? cosine(queryVec, docVecs[i]) : 0;
    return toScored(c, semantic, Boolean(queryVec));
  });

  return scored.sort((a, b) => b.semantic_score - a.semantic_score);
}

export function countPotentialHiddenGems(scored: ScoredCandidate[]): number {
  return scored.filter((c) => c.potential_hidden_gem).length;
}

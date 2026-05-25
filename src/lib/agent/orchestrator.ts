import type { CandidateAnalysis } from "@/lib/gemini";
import { parseJobDescription } from "./step1-parse-jd";
import { parseCandidates, countTitleMismatches } from "./step2-parse-candidates";
import { vectorSearch, countPotentialHiddenGems } from "./step3-vector-search";
import { ruleBasedRerank, countFlags } from "./step4-rerank";
import { hiddenGemDetection } from "./step5-hidden-gem";
import { generatePitches } from "./step6-pitches";
import { generateOutreach } from "./step7-outreach";
import type {
  AgentEvent,
  AgentResult,
  JobRequirements,
  RecruiterOutput,
} from "./types";

const SHORTLIST_SIZE = 5;

export type AgentInput = {
  jobTitle: string;
  company: string;
  requiredSkills: string[];
  experienceLevel: string;
  jobDescription: string;
  candidates: { name: string; resumeText: string }[];
};

export type AgentEmitter = (event: AgentEvent) => void;

/**
 * `runAgent` — main orchestrator.
 * 7-step Hidden Gem Detector pipeline with reasoning log + NDJSON streaming.
 */
export async function runAgent(
  input: AgentInput,
  emit: AgentEmitter,
): Promise<AgentResult> {
  const startedAt = Date.now();
  const reasoning: string[] = [];
  const log = (msg: string) => {
    reasoning.push(msg);
    emit({ type: "log", message: msg });
  };

  // ── Step 1 ───────────────────────────────────────────────────────────────
  const jd: JobRequirements = await parseJobDescription(
    input.jobDescription,
    {
      jobTitle: input.jobTitle,
      experienceLevel: input.experienceLevel,
      requiredSkills: input.requiredSkills,
    },
  );
  log(
    `Step 1 complete: extracted ${jd.hard_skills.length} hard skills, ${jd.hard_constraints.length} constraints`,
  );
  emit({ type: "job_requirements", data: jd });

  // ── Step 2 (parallel) ────────────────────────────────────────────────────
  const candidates = await parseCandidates(input.candidates, jd);
  const titleMismatches = countTitleMismatches(candidates);
  log(
    `Step 2 complete: parsed ${candidates.length} candidates, ${titleMismatches} have title mismatch`,
  );

  // ── Step 3 ───────────────────────────────────────────────────────────────
  const semantically = await vectorSearch(jd, candidates);
  const potentialGems = countPotentialHiddenGems(semantically);
  log(
    `Step 3 complete: ${semantically.length} candidates ranked, ${potentialGems} flagged as potential hidden gems`,
  );

  // ── Step 4 ───────────────────────────────────────────────────────────────
  const reranked = ruleBasedRerank(semantically, jd);
  const flagsApplied = countFlags(reranked);
  log(`Step 4 complete: reranked with rules, ${flagsApplied} flags applied`);

  // ── Step 5 — AGENTIC: Hidden Gem detection ───────────────────────────────
  const { shortlist: gemShortlist, promoted, hiddenGemsFound } =
    await hiddenGemDetection(reranked, jd, SHORTLIST_SIZE);
  log(
    `Step 5 complete: reflection promoted ${hiddenGemsFound} hidden gem${hiddenGemsFound === 1 ? "" : "s"} into shortlist`,
  );
  emit({ type: "hidden_gems", promoted, count: hiddenGemsFound });

  // ── Steps 6 + 7 (parallel per candidate) ─────────────────────────────────
  const shortlist: RecruiterOutput[] = [];
  const pitched = await generatePitches(gemShortlist, jd);
  log(`Step 6 complete: generated pitches for ${pitched.length} candidates`);

  await Promise.all(
    pitched.map(async (p) => {
      const outreach = await generateOutreach(
        p,
        jd,
        p.fit_summary,
        input.company || jd.role_title,
      );
      const entry: RecruiterOutput = { ...p, outreach_message: outreach };
      shortlist.push(entry);
      emit({ type: "candidate", result: recruiterOutputToUi(entry) });
    }),
  );
  log(`Step 7 complete: drafted ${shortlist.length} outreach messages`);

  shortlist.sort((a, b) => b.final_score - a.final_score);
  shortlist.forEach((c, i) => (c.rank = i + 1));

  const elapsedSeconds =
    Math.round(((Date.now() - startedAt) / 1000) * 10) / 10;

  emit({
    type: "stats",
    total: candidates.length,
    hiddenGems: hiddenGemsFound,
    elapsedSeconds,
  });

  return {
    job_requirements: jd,
    total_candidates_evaluated: candidates.length,
    hidden_gems_found: hiddenGemsFound,
    shortlist,
    agent_reasoning_log: reasoning,
    elapsed_seconds: elapsedSeconds,
  };
}

export function recruiterOutputToUi(r: RecruiterOutput): CandidateAnalysis {
  const b = r.score_breakdown;
  return {
    name: r.name,
    currentTitle: r.current_title,
    score: Math.round(r.final_score),
    semanticScore: Math.round(r.semantic_score * 100) / 100,
    skillScore: b.hard_skill_match,
    experienceScore: b.experience_relevance,
    domainScore: b.domain_fit,
    seniorityScore: b.seniority_alignment,
    outreachScore: b.communication_quality,
    matchedSkills: r.matched_skills,
    missingSkills: r.missing_skills,
    keyStrengths: r.key_strengths.slice(0, 3),
    whyThisPerson: r.fit_summary,
    skillsGap: r.gap_analysis,
    interviewFocus: r.interview_focus.join(" "),
    interviewFocusAreas: r.interview_focus,
    outreachMessage: r.outreach_message,
    isHiddenGem: r.is_hidden_gem,
    hiddenGemReason: r.hidden_gem_reason,
    hiddenGemStory: r.hidden_gem_story,
    flags: r.flags,
    summary:
      r.is_hidden_gem && r.hidden_gem_story
        ? r.hidden_gem_story
        : r.fit_summary.length > 140
          ? `${r.fit_summary.slice(0, 137)}…`
          : r.fit_summary,
  };
}

/**
 * Backward-compat re-exports. The canonical agent contracts live in
 * `src/lib/agent/types.ts` — this file only forwards them so existing imports
 * (`@/lib/recruiter-types`) keep working.
 */

export type {
  JobRequirements,
  ScoreBreakdown,
  RecruiterOutput,
  AgentResult,
  Candidate,
  ScoredCandidate,
} from "@/lib/agent/types";

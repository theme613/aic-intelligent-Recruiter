/**
 * Agent data contracts (TypeScript interfaces — mirrors Python models.py).
 */

export type SeniorityLevel = "junior" | "mid" | "senior" | "lead" | "manager";

export type JobRequirements = {
  role_title: string;
  seniority_level: SeniorityLevel;
  hard_skills: string[];
  soft_skills: string[];
  domain: string;
  responsibilities: string[];
  hard_constraints: string[];
  /** Exact title words used to detect title-bias in ranking */
  title_keywords: string[];
};

export type TopProject = {
  title: string;
  summary: string;
  stack: string[];
  impact?: string;
};

export type Candidate = {
  name: string;
  current_title: string;
  years_experience: number;
  skills: string[];
  top_projects: TopProject[];
  domain_exposure: string[];
  seniority_signals: string[];
  education: string;
  raw_resume: string;
  /** Does current_title contain any JD title_keywords? */
  title_match_flag: boolean;
};

export type ScoredCandidate = Candidate & {
  semantic_score: number;
  seniority_score: number;
  domain_score: number;
  domain_bonus: number;
  constraint_penalty: number;
  final_score: number;
  flags: string[];
  /** Step 3: title mismatch + high semantic similarity */
  potential_hidden_gem: boolean;
  /** Step 5: confirmed hidden gem after agentic detection */
  is_hidden_gem: boolean;
  hidden_gem_reason: string | null;
  hidden_gem_story: string | null;
};

export type ScoreBreakdown = {
  hard_skill_match: number;
  experience_relevance: number;
  domain_fit: number;
  seniority_alignment: number;
  communication_quality: number;
};

export type RecruiterOutput = ScoredCandidate & {
  rank: number;
  fit_summary: string;
  gap_analysis: string;
  interview_focus: string[];
  score_breakdown: ScoreBreakdown;
  outreach_message: string;
  matched_skills: string[];
  missing_skills: string[];
  key_strengths: string[];
};

export type AgentResult = {
  job_requirements: JobRequirements;
  total_candidates_evaluated: number;
  hidden_gems_found: number;
  shortlist: RecruiterOutput[];
  agent_reasoning_log: string[];
  elapsed_seconds: number;
};

export type AgentEvent =
  | { type: "log"; message: string }
  | { type: "job_requirements"; data: JobRequirements }
  | {
      type: "hidden_gems";
      promoted: string[];
      count: number;
    }
  | {
      type: "stats";
      total: number;
      hiddenGems: number;
      elapsedSeconds: number;
    }
  | { type: "candidate"; result: import("@/lib/gemini").CandidateAnalysis }
  | { type: "done"; demo: boolean }
  | { type: "error"; error: string };

/**
 * UI-facing types for the recruit dashboard.
 * All agent logic lives in `src/lib/agent/*`.
 */

import type { TrustSignal, GitHubRepo, FactCheckReport } from "@/lib/agent/types";

export type CandidateAnalysis = {
  name: string;
  currentTitle?: string;
  score: number;
  semanticScore?: number;
  skillScore: number;
  experienceScore: number;
  domainScore: number;
  seniorityScore: number;
  outreachScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  keyStrengths: string[];
  whyThisPerson: string;
  skillsGap: string;
  interviewFocus: string;
  interviewFocusAreas: string[];
  outreachMessage: string;
  summary: string;
  /** 💎 Hidden Gem — promoted despite title mismatch */
  isHiddenGem?: boolean;
  hiddenGemReason?: string | null;
  hiddenGemStory?: string | null;
  flags?: string[];
  /** Step 2.5 trust signals from GitHub enrichment */
  trustSignals?: TrustSignal[];
  githubUrl?: string;
  githubTopRepos?: Pick<GitHubRepo, "name" | "url" | "language" | "stars" | "description">[];
  linkedinUrl?: string;
  portfolioUrl?: string;
  /** Step 2.6 fact check report */
  factCheck?: FactCheckReport;
};

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/**
 * UI-facing types for the recruit dashboard.
 * All agent logic lives in `src/lib/agent/*`.
 */

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
};

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

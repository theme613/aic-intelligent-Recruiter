import { PROMPT_PARSE_JD } from "./prompts";
import { generateText, parseJson } from "./llm";
import type { JobRequirements, SeniorityLevel } from "./types";
import { deriveTitleKeywords } from "./utils";

const FALLBACK: JobRequirements = {
  role_title: "Unknown Role",
  seniority_level: "mid",
  hard_skills: [],
  soft_skills: [],
  domain: "general",
  responsibilities: [],
  hard_constraints: [],
  title_keywords: [],
};

const VALID_LEVELS: SeniorityLevel[] = [
  "junior",
  "mid",
  "senior",
  "lead",
  "manager",
];

function coerceLevel(level: string | undefined): SeniorityLevel {
  const l = (level ?? "").toLowerCase().trim();
  return (VALID_LEVELS as string[]).includes(l) ? (l as SeniorityLevel) : "mid";
}

/**
 * STEP 1 — parse_job_description(jd_text) -> JobRequirements
 * Model: gemini-2.0-flash · JSON mode · temperature 0.1
 */
export async function parseJobDescription(
  jdText: string,
  hints?: {
    jobTitle?: string;
    experienceLevel?: string;
    requiredSkills?: string[];
  },
): Promise<JobRequirements> {
  try {
    const prompt = PROMPT_PARSE_JD({
      jobTitle: hints?.jobTitle ?? "",
      experienceLevel: hints?.experienceLevel ?? "",
      skillsHint: (hints?.requiredSkills ?? []).join(", "),
      jdText,
    });

    const text = await generateText("extract_jd", prompt, "step1:parse_jd");
    const parsed = parseJson<JobRequirements>(text);
    const roleTitle = parsed.role_title || hints?.jobTitle || FALLBACK.role_title;

    return {
      role_title: roleTitle,
      seniority_level: coerceLevel(parsed.seniority_level),
      hard_skills: (parsed.hard_skills ?? []).map((s) => s.toLowerCase()),
      soft_skills: (parsed.soft_skills ?? []).map((s) => s.toLowerCase()),
      domain: (parsed.domain ?? FALLBACK.domain).toLowerCase(),
      responsibilities: parsed.responsibilities ?? [],
      hard_constraints: parsed.hard_constraints ?? [],
      title_keywords: deriveTitleKeywords(roleTitle, parsed.title_keywords),
    };
  } catch (err) {
    console.error("[agent.step1] parseJobDescription failed:", err);
    const roleTitle = hints?.jobTitle ?? FALLBACK.role_title;
    return {
      ...FALLBACK,
      role_title: roleTitle,
      seniority_level: coerceLevel(hints?.experienceLevel),
      hard_skills: (hints?.requiredSkills ?? []).map((s) => s.toLowerCase()),
      title_keywords: deriveTitleKeywords(roleTitle),
    };
  }
}

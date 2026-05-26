import { PROMPT_PARSE_CANDIDATE } from "./prompts";
import { generateText, parseJson } from "./llm";
import { mapConcurrent } from "./retry";
import type { Candidate, JobRequirements } from "./types";
import {
  extractResumeHeadlineTitle,
  resolveTitleMatchFlag,
} from "./utils";

function fallback(
  resumeText: string,
  hintName?: string,
  titleKeywords: string[] = [],
): Candidate {
  const headline = extractResumeHeadlineTitle(resumeText);
  return {
    name: hintName ?? "Unknown Candidate",
    current_title: headline ?? "",
    years_experience: 0,
    skills: [],
    top_projects: [],
    domain_exposure: [],
    seniority_signals: [],
    education: "",
    raw_resume: resumeText,
    title_match_flag: resolveTitleMatchFlag("", resumeText, titleKeywords),
  };
}

async function parseOne(
  resumeText: string,
  jd: JobRequirements,
  hintName?: string,
): Promise<Candidate> {
  try {
    const prompt = PROMPT_PARSE_CANDIDATE({
      hintName: hintName ?? "extract from resume",
      resumeText,
      titleKeywords: jd.title_keywords.join(", ") || jd.role_title,
    });

    const text = await generateText(
      "extract_candidate",
      prompt,
      `step2:${hintName ?? "candidate"}`,
    );
    const parsed = parseJson<Omit<Candidate, "title_match_flag" | "raw_resume">>(
      text,
    );

    const headline = extractResumeHeadlineTitle(resumeText);
    const current_title = headline ?? parsed.current_title ?? "";
    return {
      name: parsed.name || hintName || "Unknown Candidate",
      current_title,
      years_experience:
        typeof parsed.years_experience === "number"
          ? parsed.years_experience
          : 0,
      skills: (parsed.skills ?? []).map((s) => s.toLowerCase()),
      top_projects: (parsed.top_projects ?? []).slice(0, 3),
      domain_exposure: (parsed.domain_exposure ?? []).map((s) =>
        s.toLowerCase(),
      ),
      seniority_signals: parsed.seniority_signals ?? [],
      education: parsed.education ?? "",
      raw_resume: resumeText,
      title_match_flag: resolveTitleMatchFlag(
        parsed.current_title ?? "",
        resumeText,
        jd.title_keywords,
      ),
    };
  } catch (err) {
    console.error("[agent.step2] parseOne failed for", hintName, err);
    return fallback(resumeText, hintName, jd.title_keywords);
  }
}

/**
 * STEP 2 — parse_candidates(resumes) -> list[Candidate]
 * Model: gemini-2.0-flash · concurrency-limited to avoid 429 bursts
 */
export async function parseCandidates(
  resumes: { name?: string; resumeText: string }[],
  jd: JobRequirements,
): Promise<Candidate[]> {
  return mapConcurrent(resumes, (r) => parseOne(r.resumeText, jd, r.name));
}

export function countTitleMismatches(candidates: Candidate[]): number {
  return candidates.filter((c) => !c.title_match_flag).length;
}

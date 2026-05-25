import { PROMPT_OUTREACH } from "./prompts";
import { getModel } from "./llm";
import type { ScoredCandidate, JobRequirements } from "./types";

function firstNameOf(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}

function fallbackMessage(
  candidate: ScoredCandidate,
  jd: JobRequirements,
  company: string,
): string {
  const first = firstNameOf(candidate.name);
  const opener = candidate.is_hidden_gem
    ? "I almost missed your profile — your title didn't match, but your work did. "
    : "";
  return `${opener}Hi ${first} — your background as ${candidate.current_title} caught my eye, particularly around ${candidate.skills.slice(0, 3).join(", ") || "your recent work"}. We're hiring a ${jd.role_title} at ${company} on a stack that matches well. Would love a quick 15-minute chat this week — open to it?`;
}

/**
 * STEP 7 — generate_outreach(candidate, jd, fit_summary) -> str
 * Model: gemini-2.5-flash-preview-05-20 · temperature 0.8
 */
export async function generateOutreach(
  candidate: ScoredCandidate,
  jd: JobRequirements,
  fitSummary: string,
  company: string,
): Promise<string> {
  try {
    const model = getModel("outreach");
    const first = firstNameOf(candidate.name);
    const anchor =
      candidate.top_projects[0]?.summary ||
      candidate.seniority_signals[0] ||
      `your work as ${candidate.current_title}`;

    const prompt = PROMPT_OUTREACH({
      company,
      firstName: first,
      roleTitle: jd.role_title,
      seniority: jd.seniority_level,
      domain: jd.domain,
      anchor,
      fitSummary,
      isHiddenGem: candidate.is_hidden_gem,
    });

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    if (candidate.is_hidden_gem && !text.toLowerCase().includes("almost missed")) {
      text = `I almost missed your profile — your title didn't match, but your work did. ${text}`;
    }

    return text || fallbackMessage(candidate, jd, company);
  } catch (err) {
    console.error("[agent.step7] outreach failed for", candidate.name, err);
    return fallbackMessage(candidate, jd, company);
  }
}

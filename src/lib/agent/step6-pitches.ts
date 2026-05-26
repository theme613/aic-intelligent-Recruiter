import { PROMPT_PITCH } from "./prompts";
import { generateWithRetry, getModel, parseJson } from "./llm";
import { mapConcurrent } from "./retry";
import type {
  JobRequirements,
  RecruiterOutput,
  ScoreBreakdown,
  ScoredCandidate,
} from "./types";
import { buildHiddenGemStory } from "./utils";

type PitchResponse = {
  fit_summary: string;
  gap_analysis: string;
  interview_focus: string[];
  score_breakdown: ScoreBreakdown;
  matched_skills?: string[];
  missing_skills?: string[];
  key_strengths?: string[];
  hidden_gem_story?: string;
};

function fallbackPitch(
  c: ScoredCandidate,
  jd: JobRequirements,
): PitchResponse {
  const matched = c.skills.filter((s) =>
    jd.hard_skills.some((h) => s.toLowerCase().includes(h.toLowerCase())),
  );
  const missing = jd.hard_skills.filter(
    (h) => !c.skills.some((s) => s.toLowerCase().includes(h.toLowerCase())),
  );
  const pitch: PitchResponse = {
    fit_summary: `${c.name} has ${c.years_experience}+ years as ${c.current_title} with skills covering ${matched.length}/${jd.hard_skills.length} of the must-have stack.`,
    gap_analysis:
      "Automated narrative unavailable — verify gaps in interview.",
    interview_focus: [
      "Walk me through your most relevant recent project.",
      "Which required skills do you feel strongest on?",
      "Where would you need the most ramp-up?",
    ],
    score_breakdown: {
      hard_skill_match: Math.round(c.semantic_score * 100),
      experience_relevance: Math.round(c.semantic_score * 100),
      domain_fit: c.domain_score,
      seniority_alignment: c.seniority_score,
      communication_quality: 50,
    },
    matched_skills: matched,
    missing_skills: missing,
    key_strengths: c.seniority_signals.slice(0, 3),
  };
  if (c.is_hidden_gem) {
    pitch.hidden_gem_story =
      c.hidden_gem_story ||
      buildHiddenGemStory(
        c.current_title,
        c.hidden_gem_reason ?? "",
        jd.role_title,
      );
  }
  return pitch;
}

async function generatePitch(
  c: ScoredCandidate,
  jd: JobRequirements,
): Promise<PitchResponse> {
  try {
    const model = getModel("pitch");
    const prompt = PROMPT_PITCH({
      jobJson: JSON.stringify(
        {
          role: jd.role_title,
          level: jd.seniority_level,
          domain: jd.domain,
          hard_skills: jd.hard_skills,
          responsibilities: jd.responsibilities,
        },
        null,
        2,
      ),
      candidateJson: JSON.stringify(
        {
          name: c.name,
          title: c.current_title,
          is_hidden_gem: c.is_hidden_gem,
          hidden_gem_reason: c.hidden_gem_reason,
          years: c.years_experience,
          skills: c.skills,
          projects: c.top_projects,
          seniority_signals: c.seniority_signals,
          semantic_score: c.semantic_score,
        },
        null,
        2,
      ),
      isHiddenGem: c.is_hidden_gem,
    });

    const result = await generateWithRetry(model, prompt, `step6:${c.name}`);
    const parsed = parseJson<PitchResponse>(result.response.text());
    const story =
      c.is_hidden_gem
        ? parsed.hidden_gem_story ||
          c.hidden_gem_story ||
          buildHiddenGemStory(
            c.current_title,
            c.hidden_gem_reason ?? "",
            jd.role_title,
          )
        : null;

    return {
      ...parsed,
      interview_focus: parsed.interview_focus ?? [],
      matched_skills: parsed.matched_skills ?? [],
      missing_skills: parsed.missing_skills ?? [],
      key_strengths: (parsed.key_strengths ?? []).slice(0, 3),
      hidden_gem_story: story ?? undefined,
    };
  } catch (err) {
    console.error("[agent.step6] pitch failed for", c.name, err);
    return fallbackPitch(c, jd);
  }
}

/**
 * STEP 6 — generate_pitches(shortlist, jd) -> list[RecruiterOutput]
 * Model: gemini-2.5-flash · concurrency-limited to avoid 429 bursts
 */
export async function generatePitches(
  shortlist: ScoredCandidate[],
  jd: JobRequirements,
): Promise<Omit<RecruiterOutput, "outreach_message">[]> {
  return mapConcurrent(
    shortlist,
    async (c, i) => {
      const pitch = await generatePitch(c, jd);
      return {
        ...c,
        rank: i + 1,
        fit_summary: pitch.fit_summary,
        gap_analysis: pitch.gap_analysis,
        interview_focus: pitch.interview_focus,
        score_breakdown: pitch.score_breakdown,
        matched_skills: pitch.matched_skills ?? [],
        missing_skills: pitch.missing_skills ?? [],
        key_strengths: pitch.key_strengths ?? [],
        hidden_gem_story:
          c.is_hidden_gem
            ? pitch.hidden_gem_story ||
              c.hidden_gem_story ||
              buildHiddenGemStory(
                c.current_title,
                c.hidden_gem_reason ?? "",
                jd.role_title,
              )
            : null,
      };
    },
  );
}

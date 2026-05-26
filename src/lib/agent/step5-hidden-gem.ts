import { PROMPT_HIDDEN_GEM_DETECTION } from "./prompts";
import { generateText, parseJson } from "./llm";
import type { JobRequirements, ScoredCandidate } from "./types";
import { buildHiddenGemStory, jdSummary, summarizeCandidate } from "./utils";

type PromotedGem = {
  name: string;
  promote?: boolean;
  hidden_gem_reason: string;
  hidden_gem_story?: string;
  replace_candidate?: string | null;
  add_additional?: boolean;
};

type HiddenGemResponse = {
  promoted_gems: PromotedGem[];
};

const SHORTLIST_SIZE = 5;

function markAsHiddenGem(
  gem: ScoredCandidate,
  jd: JobRequirements,
  reason?: string,
): ScoredCandidate {
  const hidden_gem_reason =
    reason ??
    `Ranked low because title says ${gem.current_title}, but promoted because work evidence strongly matches ${jd.role_title}`;
  const hidden_gem_story = buildHiddenGemStory(
    gem.current_title,
    hidden_gem_reason,
    jd.role_title,
  );
  return {
    ...gem,
    is_hidden_gem: true,
    hidden_gem_reason,
    hidden_gem_story,
    flags: [
      ...gem.flags.filter((f) => f !== "hidden_gem"),
      "hidden_gem",
      "title_mismatch",
    ],
  };
}

/** Merge promoted gems into the shortlist (in-place replace, swap, or append). */
function mergeIntoShortlist(
  shortlist: ScoredCandidate[],
  promoted: ScoredCandidate,
  decision: PromotedGem,
  shortlistSize: number,
): ScoredCandidate[] {
  const next = [...shortlist];
  const idx = next.findIndex(
    (c) => c.name.toLowerCase() === promoted.name.toLowerCase(),
  );
  if (idx >= 0) {
    next[idx] = promoted;
    return next;
  }
  if (decision.add_additional) {
    next.push(promoted);
    return next;
  }
  const replaceName = decision.replace_candidate?.toLowerCase();
  if (replaceName) {
    const rIdx = next.findIndex(
      (c) => c.name.toLowerCase() === replaceName,
    );
    if (rIdx >= 0) {
      next[rIdx] = promoted;
      return next;
    }
    next.push(promoted);
    return next;
  }
  let lowestIdx = -1;
  let lowestScore = Infinity;
  for (let i = 0; i < next.length; i++) {
    if (next[i].is_hidden_gem) continue;
    if (next[i].final_score < lowestScore) {
      lowestScore = next[i].final_score;
      lowestIdx = i;
    }
  }
  if (lowestIdx >= 0 && next.length >= shortlistSize) {
    next[lowestIdx] = promoted;
  } else {
    next.push(promoted);
  }
  return next;
}

/**
 * Deterministic promotion when the Step 5 LLM is unavailable (429 / quota) or
 * returns an empty list. Demo mode uses a similar idea via `looksLikeHiddenGemResume`;
 * live runs must not depend solely on a single Gemini call.
 */
function promotePotentialGemsRuleBased(
  ranked: ScoredCandidate[],
  top5: ScoredCandidate[],
  jd: JobRequirements,
  shortlistSize: number,
): {
  shortlist: ScoredCandidate[];
  promoted: string[];
  hiddenGemsFound: number;
} {
  const potentialGems = ranked.filter((c) => c.potential_hidden_gem);
  if (potentialGems.length === 0) {
    return { shortlist: top5, promoted: [], hiddenGemsFound: 0 };
  }

  let shortlist = [...top5];
  const promotedNames: string[] = [];

  for (const gem of potentialGems) {
    const promoted = markAsHiddenGem(gem, jd);
    promotedNames.push(gem.name);
    shortlist = mergeIntoShortlist(shortlist, promoted, {
      name: gem.name,
      promote: true,
      hidden_gem_reason: promoted.hidden_gem_reason!,
      replace_candidate: null,
      add_additional: false,
    }, shortlistSize);
  }

  shortlist = shortlist
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, Math.max(shortlistSize, shortlist.length));

  console.warn(
    `[agent.step5] rule-based hidden gem promotion for: ${promotedNames.join(", ")}`,
  );

  return {
    shortlist,
    promoted: promotedNames,
    hiddenGemsFound: promotedNames.length,
  };
}

/**
 * STEP 5 — hidden_gem_detection(all_candidates, jd) -> list[ScoredCandidate]
 *
 * # AGENTIC STEP: reflection loop with self-correction
 *
 * Reviews top-5 shortlist vs candidates flagged as potential_hidden_gem (title
 * mismatch + strong semantic match) and promotes overlooked talent.
 *
 * Falls back to rule-based promotion when the LLM fails or returns nobody —
 * otherwise hidden gems only appear in demo mode (which never calls this step).
 */
export async function hiddenGemDetection(
  ranked: ScoredCandidate[],
  jd: JobRequirements,
  shortlistSize = SHORTLIST_SIZE,
): Promise<{
  shortlist: ScoredCandidate[];
  promoted: string[];
  hiddenGemsFound: number;
}> {
  const top5 = ranked.slice(0, shortlistSize);
  const topNames = new Set(top5.map((c) => c.name.toLowerCase()));
  const potentialGems = ranked.filter((c) => c.potential_hidden_gem);

  if (potentialGems.length === 0) {
    return { shortlist: top5, promoted: [], hiddenGemsFound: 0 };
  }

  try {
    const prompt = PROMPT_HIDDEN_GEM_DETECTION({
      jdJson: jdSummary(jd),
      top5Json: JSON.stringify(top5.map(summarizeCandidate), null, 2),
      potentialGemsJson: JSON.stringify(
        potentialGems.map(summarizeCandidate),
        null,
        2,
      ),
    });

    const text = await generateText("hidden_gem", prompt, "step5:hidden_gem");
    const parsed = parseJson<HiddenGemResponse>(text);
    const decisions = (parsed.promoted_gems ?? []).filter(
      (g) => g.promote !== false && g.name,
    );

    if (decisions.length === 0) {
      console.warn(
        "[agent.step5] LLM returned no promotions — using rule-based fallback",
      );
      return promotePotentialGemsRuleBased(ranked, top5, jd, shortlistSize);
    }

    let shortlist = [...top5];
    const promotedNames: string[] = [];

    for (const decision of decisions) {
      const gem = ranked.find(
        (c) => c.name.toLowerCase() === decision.name.toLowerCase(),
      );
      if (!gem) continue;

      const promotedCandidate = markAsHiddenGem(
        gem,
        jd,
        decision.hidden_gem_reason,
      );
      if (decision.hidden_gem_story) {
        promotedCandidate.hidden_gem_story = decision.hidden_gem_story;
      }

      promotedNames.push(gem.name);

      if (topNames.has(gem.name.toLowerCase())) {
        shortlist = shortlist.map((c) =>
          c.name === gem.name ? promotedCandidate : c,
        );
        continue;
      }

      shortlist = mergeIntoShortlist(
        shortlist,
        promotedCandidate,
        decision,
        shortlistSize,
      );
    }

    if (promotedNames.length === 0) {
      return promotePotentialGemsRuleBased(ranked, top5, jd, shortlistSize);
    }

    shortlist = shortlist
      .sort((a, b) => b.final_score - a.final_score)
      .slice(0, Math.max(shortlistSize, shortlist.length));

    return {
      shortlist,
      promoted: promotedNames,
      hiddenGemsFound: promotedNames.length,
    };
  } catch (err) {
    console.error(
      "[agent.step5] hidden gem LLM failed — using rule-based fallback:",
      err,
    );
    return promotePotentialGemsRuleBased(ranked, top5, jd, shortlistSize);
  }
}

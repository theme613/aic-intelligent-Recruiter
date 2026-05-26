import { PROMPT_HIDDEN_GEM_DETECTION } from "./prompts";
import { getModel, parseJson } from "./llm";
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

/**
 * STEP 5 — hidden_gem_detection(all_candidates, jd) -> list[ScoredCandidate]
 *
 * # AGENTIC STEP: reflection loop with self-correction
 *
 * Uses gemini-2.5-pro ONCE. Reviews top-5 shortlist vs candidates flagged as
 * potential_hidden_gem (title mismatch + strong semantic match) and promotes
 * overlooked talent into the final shortlist.
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
    const model = getModel("hidden_gem");

    const prompt = PROMPT_HIDDEN_GEM_DETECTION({
      jdJson: jdSummary(jd),
      top5Json: JSON.stringify(top5.map(summarizeCandidate), null, 2),
      potentialGemsJson: JSON.stringify(
        potentialGems.map(summarizeCandidate),
        null,
        2,
      ),
    });

    const result = await model.generateContent(prompt);
    const parsed = parseJson<HiddenGemResponse>(result.response.text());
    const decisions = (parsed.promoted_gems ?? []).filter(
      (g) => g.promote !== false && g.name,
    );

    if (decisions.length === 0) {
      return { shortlist: top5, promoted: [], hiddenGemsFound: 0 };
    }

    let shortlist = [...top5];
    const promotedNames: string[] = [];

    for (const decision of decisions) {
      const gem = ranked.find(
        (c) => c.name.toLowerCase() === decision.name.toLowerCase(),
      );
      if (!gem) continue;

      const reason =
        decision.hidden_gem_reason ||
        `Ranked low because title says ${gem.current_title}, but promoted because work evidence matches ${jd.role_title} requirements`;
      const story =
        decision.hidden_gem_story ||
        buildHiddenGemStory(gem.current_title, reason, jd.role_title);

      const promotedCandidate: ScoredCandidate = {
        ...gem,
        is_hidden_gem: true,
        hidden_gem_reason: reason,
        hidden_gem_story: story,
        flags: [...gem.flags, "hidden_gem"],
      };

      promotedNames.push(gem.name);

      if (topNames.has(gem.name.toLowerCase())) {
        shortlist = shortlist.map((c) =>
          c.name === gem.name ? promotedCandidate : c,
        );
        continue;
      }

      if (decision.add_additional) {
        shortlist.push(promotedCandidate);
        continue;
      }

      const replaceName = decision.replace_candidate?.toLowerCase();
      if (replaceName) {
        const idx = shortlist.findIndex(
          (c) => c.name.toLowerCase() === replaceName,
        );
        if (idx >= 0) {
          shortlist[idx] = promotedCandidate;
        } else {
          shortlist.push(promotedCandidate);
        }
      } else {
        // Replace lowest non-gem in shortlist
        let lowestIdx = -1;
        let lowestScore = Infinity;
        for (let i = 0; i < shortlist.length; i++) {
          if (shortlist[i].is_hidden_gem) continue;
          if (shortlist[i].final_score < lowestScore) {
            lowestScore = shortlist[i].final_score;
            lowestIdx = i;
          }
        }
        if (lowestIdx >= 0 && shortlist.length >= shortlistSize) {
          shortlist[lowestIdx] = promotedCandidate;
        } else {
          shortlist.push(promotedCandidate);
        }
      }
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
    console.error("[agent.step5] hidden gem detection failed — returning top candidates without promotion:", err);
    return { shortlist: top5, promoted: [], hiddenGemsFound: 0 };
  }
}

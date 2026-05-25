import { hasGeminiApiKey } from "@/lib/gemini";
import { formatGeminiError } from "@/lib/gemini-errors";
import {
  demoJobRequirements,
  DEMO_HIDDEN_GEM_NAME,
  resolveDemoResult,
} from "@/lib/demoData";
import { runAgent } from "@/lib/agent/orchestrator";
import type { AgentEvent } from "@/lib/agent/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type AnalyzeRequest = {
  jobTitle: string;
  company: string;
  requiredSkills: string[];
  experienceLevel: string;
  jobDescription: string;
  candidates: { name: string; resumeText: string }[];
  demoMode?: boolean;
};

function encodeEvent(encoder: TextEncoder, event: AgentEvent): Uint8Array {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

/** Shorter pauses on Vercel so demo mode stays under Hobby's ~10s function limit. */
function demoDelay(ms: number): Promise<void> {
  const scaled = process.env.VERCEL ? Math.min(ms, 100) : ms;
  return new Promise((r) => setTimeout(r, scaled));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeRequest;
    const {
      jobTitle,
      company,
      requiredSkills,
      experienceLevel,
      jobDescription,
      candidates,
      demoMode,
    } = body;

    if (!jobTitle || !jobDescription || !candidates?.length) {
      return new Response(
        JSON.stringify({
          error: "Job details and at least one candidate are required.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const useDemo = demoMode || !hasGeminiApiKey();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const emit = (event: AgentEvent) => {
          controller.enqueue(encodeEvent(encoder, event));
        };
        const demoStarted = Date.now();

        try {
          if (useDemo) {
            const titleMismatches = candidates.filter((c) => {
              const t = c.name.toLowerCase();
              return (
                t.includes("jordan") ||
                t.includes("david") ||
                c.name === "Jordan Kim"
              );
            }).length;
            const hasJordan = candidates.some(
              (c) =>
                c.name.toLowerCase() === DEMO_HIDDEN_GEM_NAME.toLowerCase(),
            );

            emit({
              type: "log",
              message: "Demo mode: streaming Hidden Gem pipeline (no Gemini calls)",
            });
            emit({ type: "job_requirements", data: demoJobRequirements });
            await demoDelay(200);
            emit({
              type: "log",
              message: `Step 1 complete: extracted ${demoJobRequirements.hard_skills.length} hard skills, ${demoJobRequirements.hard_constraints.length} constraints`,
            });
            await demoDelay(200);
            emit({
              type: "log",
              message: `Step 2 complete: parsed ${candidates.length} candidates, ${Math.max(1, titleMismatches)} have title mismatch`,
            });
            await demoDelay(200);
            emit({
              type: "log",
              message: `Step 3 complete: ${candidates.length} candidates ranked, ${hasJordan ? 1 : 0} flagged as potential hidden gems`,
            });
            await demoDelay(200);
            emit({
              type: "log",
              message: `Step 4 complete: reranked with rules, 2 flags applied`,
            });
            await demoDelay(300);
            const promoted = hasJordan ? [DEMO_HIDDEN_GEM_NAME] : [];
            emit({
              type: "hidden_gems",
              promoted,
              count: promoted.length,
            });
            emit({
              type: "log",
              message: `Step 5 complete: reflection promoted ${promoted.length} hidden gem${promoted.length === 1 ? "" : "s"} into shortlist`,
            });
            await demoDelay(200);
            emit({
              type: "log",
              message: `Step 6 complete: generated pitches for ${candidates.length} candidates`,
            });

            const results = candidates
              .map((c, i) => resolveDemoResult(c, i))
              .sort((a, b) => b.score - a.score);

            for (const result of results) {
              emit({ type: "candidate", result });
              await demoDelay(400);
            }

            emit({
              type: "log",
              message: `Step 7 complete: drafted ${results.length} outreach messages`,
            });

            const elapsedSeconds =
              Math.round(((Date.now() - demoStarted) / 1000) * 10) / 10;
            emit({
              type: "stats",
              total: candidates.length,
              hiddenGems: promoted.length,
              elapsedSeconds,
            });
            emit({ type: "done", demo: true });
            controller.close();
            return;
          }

          await runAgent(
            {
              jobTitle,
              company,
              requiredSkills,
              experienceLevel,
              jobDescription,
              candidates,
            },
            emit,
          );
          emit({ type: "done", demo: false });
          controller.close();
        } catch (err) {
          console.error("Agent pipeline error:", err);
          emit({ type: "error", error: formatGeminiError(err) });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Analyze route error:", err);
    return new Response(
      JSON.stringify({
        error: "Something went wrong while analyzing candidates.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

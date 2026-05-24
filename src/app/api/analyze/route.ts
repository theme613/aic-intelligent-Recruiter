import {
  analyzeCandidate,
  hasGeminiApiKey,
  normalizeAnalysis,
  type CandidateAnalysis,
} from "@/lib/gemini";
import { resolveDemoResult } from "@/lib/demoData";
import { cosineSimilarityScore } from "@/lib/vector";

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

type StreamEvent =
  | { type: "candidate"; result: CandidateAnalysis }
  | { type: "done"; demo: boolean }
  | { type: "error"; error: string };

function encodeEvent(encoder: TextEncoder, event: StreamEvent): Uint8Array {
  return encoder.encode(`${JSON.stringify(event)}\n`);
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
        JSON.stringify({ error: "Job details and at least one candidate are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const useDemo = demoMode || !hasGeminiApiKey();
    const jobContext = `${jobTitle} ${company} ${requiredSkills.join(" ")} ${experienceLevel} ${jobDescription}`;

    const rankedCandidates = [...candidates].sort((a, b) => {
      const scoreA = cosineSimilarityScore(jobContext, a.resumeText);
      const scoreB = cosineSimilarityScore(jobContext, b.resumeText);
      return scoreB - scoreA;
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          if (useDemo) {
            for (let i = 0; i < rankedCandidates.length; i++) {
              const candidate = rankedCandidates[i];
              const result = resolveDemoResult(candidate, i);
              controller.enqueue(
                encodeEvent(encoder, { type: "candidate", result }),
              );
              await new Promise((r) => setTimeout(r, 400));
            }
            controller.enqueue(
              encodeEvent(encoder, { type: "done", demo: true }),
            );
            controller.close();
            return;
          }

          for (const candidate of rankedCandidates) {
            try {
              const analysis = await analyzeCandidate({
                jobTitle,
                company,
                requiredSkills,
                experienceLevel,
                jobDescription,
                resumeText: candidate.resumeText,
                candidateName: candidate.name,
              });

              const result = normalizeAnalysis(
                analysis,
                candidate.name || "Unknown Candidate",
              );

              controller.enqueue(
                encodeEvent(encoder, { type: "candidate", result }),
              );
            } catch (err) {
              console.error(
                "Gemini analysis failed for candidate:",
                candidate.name,
                err,
              );
              controller.enqueue(
                encodeEvent(encoder, {
                  type: "error",
                  error:
                    "AI analysis failed. Check your GEMINI_API_KEY or use Load Demo Data for offline demo.",
                }),
              );
              controller.close();
              return;
            }
          }

          controller.enqueue(
            encodeEvent(encoder, { type: "done", demo: false }),
          );
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encodeEvent(encoder, {
              type: "error",
              error: "Something went wrong while analyzing candidates.",
            }),
          );
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
      JSON.stringify({ error: "Something went wrong while analyzing candidates." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

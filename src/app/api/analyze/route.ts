import { NextResponse } from "next/server";
import {
  analyzeCandidate,
  hasGeminiApiKey,
  type CandidateAnalysis,
} from "@/lib/gemini";
import { demoMockResults } from "@/lib/demoData";
import { cosineSimilarityScore } from "@/lib/vector";

export const maxDuration = 30;

type AnalyzeRequest = {
  jobTitle: string;
  company: string;
  requiredSkills: string[];
  experienceLevel: string;
  jobDescription: string;
  candidates: { name: string; resumeText: string }[];
  demoMode?: boolean;
};

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
      return NextResponse.json(
        { error: "Job details and at least one candidate are required." },
        { status: 400 },
      );
    }

    const useDemo = demoMode || !hasGeminiApiKey();

    if (useDemo) {
      const results = candidates
        .map((c, i) => {
          const mock =
            demoMockResults.find(
              (m) => m.name.toLowerCase() === c.name.toLowerCase(),
            ) ?? demoMockResults[i % demoMockResults.length];
          return { ...mock, name: c.name || mock.name };
        })
        .sort((a, b) => b.score - a.score);
      return NextResponse.json({ results, demo: true });
    }

    const jobContext = `${jobTitle} ${company} ${requiredSkills.join(" ")} ${experienceLevel} ${jobDescription}`;

    const rankedCandidates = [...candidates].sort((a, b) => {
      const scoreA = cosineSimilarityScore(jobContext, a.resumeText);
      const scoreB = cosineSimilarityScore(jobContext, b.resumeText);
      return scoreB - scoreA;
    });

    const results: CandidateAnalysis[] = [];

    for (const candidate of rankedCandidates) {
      try {
        const analysis = await analyzeCandidate({
          jobTitle,
          company,
          requiredSkills,
          experienceLevel,
          jobDescription,
          resumeText: candidate.resumeText,
        });

        results.push({
          ...analysis,
          name: analysis.name || candidate.name || "Unknown Candidate",
        });
      } catch (err) {
        console.error("Gemini analysis failed for candidate:", candidate.name, err);
        return NextResponse.json(
          {
            error:
              "AI analysis failed. Check your GEMINI_API_KEY or use Load Demo Data for offline demo.",
          },
          { status: 502 },
        );
      }
    }

    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({ results, demo: false });
  } catch (err) {
    console.error("Analyze route error:", err);
    return NextResponse.json(
      { error: "Something went wrong while analyzing candidates." },
      { status: 500 },
    );
  }
}

"use client";

import { Download, Loader2, Sparkles } from "lucide-react";
import { CandidateCard } from "@/components/CandidateCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { CandidateAnalysis } from "@/lib/chutes";

type Props = {
  results: CandidateAnalysis[];
  loading: boolean;
  progress: number;
  error: string | null;
  demoMode: boolean;
};

export function ResultsPanel({
  results,
  loading,
  progress,
  error,
  demoMode,
}: Props) {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ results }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recruitment-results.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-16">
        <Loader2 className="size-12 animate-spin text-violet-500" />
        <div className="w-full max-w-md space-y-3 text-center">
          <p className="text-lg font-medium text-white">Analyzing candidates with AI...</p>
          <p className="text-sm text-gray-500">
            Scoring resumes, matching skills, and drafting outreach
          </p>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-600">{Math.round(progress)}%</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <p className="text-red-400">{error}</p>
        <p className="mt-2 text-sm text-gray-500">
          Try &quot;Load Demo Data&quot; for an offline demo without an API key.
        </p>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-950/50 py-16 text-center">
        <Sparkles className="mx-auto mb-4 size-10 text-gray-600" />
        <p className="text-gray-400">
          Upload resumes and run analysis to see ranked candidates here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Ranked Candidates</h2>
          <p className="text-sm text-gray-500">
            Sorted by AI match score {demoMode && "(demo mode)"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-gray-700 text-gray-400">
            Powered by Chutes.AI
          </Badge>
          <Button
            variant="outline"
            className="border-gray-700"
            onClick={exportJson}
          >
            <Download className="mr-2 size-4" />
            Export JSON
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {results.map((candidate, index) => (
          <CandidateCard
            key={`${candidate.name}-${index}`}
            candidate={candidate}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

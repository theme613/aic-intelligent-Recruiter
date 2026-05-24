"use client";

import { Download, Loader2, Sparkles } from "lucide-react";
import { CandidateCard } from "@/components/CandidateCard";
import { PillButton } from "@/components/PillButton";
import { Progress } from "@/components/ui/progress";
import type { CandidateAnalysis } from "@/lib/gemini";

type Props = {
  results: CandidateAnalysis[];
  loading: boolean;
  progress: number;
  error: string | null;
  demoMode: boolean;
  totalCandidates?: number;
};

function KpiCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border-b border-black p-5 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-[10px] font-medium tracking-[0.2em] text-black/50">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-black/60">{sub}</p>}
    </div>
  );
}

export function ResultsPanel({
  results,
  loading,
  progress,
  error,
  demoMode,
  totalCandidates = 0,
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

  const analyzedCount = results.length;
  const topScore = analyzedCount ? Math.max(...results.map((r) => r.score)) : 0;
  const avgScore = analyzedCount
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / analyzedCount)
    : 0;
  const strongMatches = results.filter((r) => r.score >= 75).length;
  const showPartial = loading && analyzedCount > 0;

  if (loading && !showPartial) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-16">
        <Loader2 className="size-12 animate-spin text-black" />
        <div className="w-full max-w-md space-y-3 text-center">
          <p className="text-lg font-bold tracking-tight">Analyzing with AI…</p>
          <p className="text-sm text-black/60">
            Scoring dimensions, matching skills, drafting outreach
          </p>
          <Progress value={progress} className="h-1 rounded-none bg-black/10 [&>div]:bg-black" />
          <p className="text-xs text-black/50">
            {totalCandidates > 0
              ? `${analyzedCount} of ${totalCandidates} · ${Math.round(progress)}%`
              : `${Math.round(progress)}%`}
          </p>
        </div>
      </div>
    );
  }

  if (error && !analyzedCount) {
    return (
      <div className="border border-[#E63946] bg-[#E63946]/5 p-6 text-center">
        <p className="text-[#E63946]">{error}</p>
        <p className="mt-2 text-sm text-black/60">
          Try &quot;Load Demo Data&quot; for an offline demo without an API key.
        </p>
      </div>
    );
  }

  if (!analyzedCount && !loading) {
    return (
      <div className="border border-black bg-[#f4f4f4] py-16 text-center">
        <Sparkles className="mx-auto mb-4 size-10 text-black/30" />
        <p className="text-black/60">
          Upload resumes and run analysis to see ranked candidates here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {loading && showPartial && (
        <div className="mb-6 border border-black bg-[#f4f4f4] p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium">
              <Loader2 className="size-4 animate-spin" />
              Streaming results…
            </span>
            <span className="text-black/50">
              {analyzedCount}
              {totalCandidates > 0 ? ` / ${totalCandidates}` : ""}
            </span>
          </div>
          <Progress value={progress} className="h-1 rounded-none bg-black/10 [&>div]:bg-black" />
        </div>
      )}

      {error && (
        <div className="mb-6 border border-black bg-[#f4f4f4] px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <section className="mb-8 grid grid-cols-2 border border-black lg:grid-cols-4">
        <KpiCell
          label="ANALYZED"
          value={String(analyzedCount)}
          sub={totalCandidates > analyzedCount ? `${totalCandidates} total` : undefined}
        />
        <KpiCell label="TOP MATCH" value={`${topScore}%`} sub="best fit" />
        <KpiCell label="AVERAGE" value={`${avgScore}%`} sub="across pool" />
        <KpiCell label="STRONG FITS" value={String(strongMatches)} sub="score ≥ 75%" />
      </section>

      <div className="mb-6 flex flex-col gap-4 border-b border-black pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Ranked candidates</h2>
          <p className="mt-1 text-sm text-black/60">
            Weighted AI score {demoMode && "· demo mode"}
          </p>
        </div>
        <PillButton variant="outline" onClick={exportJson} disabled={!analyzedCount} className="!py-2">
          <Download className="mr-2 size-4" />
          EXPORT JSON
        </PillButton>
      </div>

      <div className="grid gap-0 divide-y divide-black border border-black">
        {results.map((candidate, index) => (
          <CandidateCard
            key={`${candidate.name}-${candidate.score}-${index}`}
            candidate={candidate}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

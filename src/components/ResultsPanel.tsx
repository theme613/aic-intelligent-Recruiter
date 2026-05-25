"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Gem,
  Loader2,
  Sparkles,
} from "lucide-react";
import { CandidateCard } from "@/components/CandidateCard";
import { JobRequirementsPanel } from "@/components/JobRequirementsPanel";
import { PillButton } from "@/components/PillButton";
import { Progress } from "@/components/ui/progress";
import type { CandidateAnalysis } from "@/lib/gemini";
import type { JobRequirements } from "@/lib/agent/types";
import { cn } from "@/lib/utils";

type Props = {
  results: CandidateAnalysis[];
  jobRequirements: JobRequirements | null;
  loading: boolean;
  progress: number;
  error: string | null;
  demoMode: boolean;
  totalCandidates?: number;
  reasoningLog?: string[];
  hiddenGemsFound?: number;
  elapsedSeconds?: number | null;
};

function StatsBar({
  total,
  analyzed,
  hiddenGems,
  elapsedSeconds,
  loading,
}: {
  total: number;
  analyzed: number;
  hiddenGems: number;
  elapsedSeconds: number | null;
  loading: boolean;
}) {
  return (
    <section className="mb-6 grid w-full min-w-0 grid-cols-2 border border-black sm:grid-cols-3">
      <div className="min-w-0 border-b border-r border-black p-3 sm:border-b-0 sm:p-4">
        <p className="text-[9px] font-bold leading-tight tracking-[0.15em] text-black/50 sm:text-[10px] sm:tracking-[0.25em]">
          EVALUATED
        </p>
        <p className="mt-1 truncate text-xl font-bold sm:text-2xl">
          {loading ? total : analyzed}
          {total > analyzed && !loading ? ` / ${total}` : ""}
        </p>
      </div>
      <div
        className={cn(
          "min-w-0 border-b border-black p-3 sm:border-b-0 sm:border-r sm:p-4",
          hiddenGems > 0 && "bg-amber-50",
        )}
      >
        <p className="flex min-w-0 items-start gap-1 text-[9px] font-bold leading-tight tracking-[0.15em] text-black/50 sm:text-[10px] sm:tracking-[0.25em]">
          <Gem className="mt-0.5 size-3 shrink-0 text-amber-600" />
          <span className="break-words">HIDDEN GEMS</span>
        </p>
        <p className="mt-1 text-xl font-bold text-amber-700 sm:text-2xl">
          {hiddenGems}
        </p>
      </div>
      <div className="col-span-2 min-w-0 border-t border-black p-3 sm:col-span-1 sm:border-t-0 sm:border-r-0 sm:p-4">
        <p className="text-[9px] font-bold leading-tight tracking-[0.15em] text-black/50 sm:text-[10px] sm:tracking-[0.25em]">
          TIME TAKEN
        </p>
        <p className="mt-1 text-xl font-bold sm:text-2xl">
          {elapsedSeconds != null ? `${elapsedSeconds}s` : loading ? "…" : "—"}
        </p>
      </div>
    </section>
  );
}

function ReasoningLogPanel({
  entries,
  running,
  defaultOpen,
}: {
  entries: string[];
  running: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);

  if (entries.length === 0 && !running) return null;

  return (
    <section className="mb-8 w-full min-w-0 border border-black">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full flex-col gap-2 border-b border-black bg-black px-4 py-3 text-left text-white sm:flex-row sm:items-center sm:justify-between sm:px-5"
      >
        <div className="min-w-0 pr-8 sm:pr-0">
          <p className="text-[10px] font-bold tracking-[0.2em]">
            AGENT REASONING LOG
          </p>
          <p className="mt-0.5 text-xs leading-snug text-white/60">
            7-step pipeline · gemini-2.0-flash → embeddings → gemini-2.5-pro
            (hidden gems) → gemini-2.5-flash-preview
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2 self-end text-xs sm:self-center">
          {running && (
            <>
              <Loader2 className="size-3 animate-spin" />
              live
            </>
          )}
          {open ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronUp className="size-4" />
          )}
        </span>
      </button>
      {open && (
        <ol className="max-h-48 divide-y divide-black/10 overflow-y-auto overflow-x-hidden bg-[#f4f4f4] font-mono text-[11px]">
          {entries.map((entry, i) => (
            <li key={i} className="flex gap-3 px-4 py-2 sm:px-5">
              <span className="shrink-0 text-black/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 break-words text-black/90">{entry}</span>
            </li>
          ))}
          {running && entries.length < 7 && (
            <li className="flex gap-3 px-4 py-2 text-black/50 sm:px-5">
              <Loader2 className="size-3 shrink-0 animate-spin" />
              <span>Running next step…</span>
            </li>
          )}
        </ol>
      )}
    </section>
  );
}

export function ResultsPanel({
  results,
  jobRequirements,
  loading,
  progress,
  error,
  demoMode,
  totalCandidates = 0,
  reasoningLog = [],
  hiddenGemsFound = 0,
  elapsedSeconds = null,
}: Props) {
  const exportJson = () => {
    const payload = {
      job_requirements: jobRequirements,
      total_candidates_evaluated: totalCandidates,
      hidden_gems_found: hiddenGemsFound,
      shortlist: results.map((r, i) => ({
        rank: i + 1,
        name: r.name,
        current_title: r.currentTitle,
        final_score: r.score,
        semantic_score: r.semanticScore,
        is_hidden_gem: r.isHiddenGem ?? false,
        hidden_gem_reason: r.hiddenGemReason ?? null,
        hidden_gem_story: r.hiddenGemStory ?? null,
        score_breakdown: {
          hard_skill_match: r.skillScore,
          experience_relevance: r.experienceScore,
          domain_fit: r.domainScore,
          seniority_alignment: r.seniorityScore,
          communication_quality: r.outreachScore,
        },
        fit_summary: r.whyThisPerson,
        gap_analysis: r.skillsGap,
        interview_focus: r.interviewFocusAreas,
        outreach_message: r.outreachMessage,
        flags: r.flags ?? [],
      })),
      agent_reasoning_log: reasoningLog,
      elapsed_seconds: elapsedSeconds,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
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
  const gemsInResults = results.filter((r) => r.isHiddenGem).length;
  const hiddenGems = Math.max(hiddenGemsFound, gemsInResults);
  const topScore = analyzedCount ? Math.max(...results.map((r) => r.score)) : 0;
  const avgScore = analyzedCount
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / analyzedCount)
    : 0;
  const strongMatches = results.filter((r) => r.score >= 75).length;
  const showPartial =
    loading && (analyzedCount > 0 || reasoningLog.length > 0);

  if (loading && !showPartial) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-16">
        <Loader2 className="size-12 animate-spin text-black" />
        <div className="w-full max-w-md space-y-3 px-4 text-center">
          <p className="text-lg font-bold tracking-tight">
            Hidden Gem Detector running…
          </p>
          <p className="text-sm text-black/60">
            Parsing · embedding · detecting gems · drafting outreach
          </p>
          <Progress
            value={progress}
            className="h-1 rounded-none bg-black/10 [&>div]:bg-black"
          />
        </div>
      </div>
    );
  }

  if (error && !analyzedCount && reasoningLog.length === 0) {
    return (
      <div className="border border-[#E63946] bg-[#E63946]/5 px-4 py-6 text-center sm:p-6">
        <p className="text-[#E63946]">{error}</p>
        <p className="mt-2 text-sm text-black/60">
          Try &quot;Load Demo Data&quot; for an offline demo without an API key.
        </p>
      </div>
    );
  }

  if (!analyzedCount && !loading && reasoningLog.length === 0) {
    return (
      <div className="border border-black bg-[#f4f4f4] px-4 py-16 text-center">
        <Sparkles className="mx-auto mb-4 size-10 text-black/30" />
        <p className="text-black/60">
          Upload resumes and run analysis to see ranked candidates here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      {loading && showPartial && (
        <div className="w-full border border-black bg-[#f4f4f4] p-4">
          <div className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-medium">
              <Loader2 className="size-4 shrink-0 animate-spin" />
              <span className="truncate">Agent pipeline running…</span>
            </span>
            <span className="shrink-0 text-black/50">
              {analyzedCount}
              {totalCandidates > 0 ? ` / ${totalCandidates}` : ""}
            </span>
          </div>
          <Progress
            value={progress}
            className="h-1 rounded-none bg-black/10 [&>div]:bg-black"
          />
        </div>
      )}

      {error && (
        <div className="w-full border border-black bg-[#f4f4f4] px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <StatsBar
        total={totalCandidates}
        analyzed={analyzedCount}
        hiddenGems={hiddenGems}
        elapsedSeconds={elapsedSeconds}
        loading={loading}
      />

      <ReasoningLogPanel
        entries={reasoningLog}
        running={loading}
        defaultOpen={loading}
      />

      {jobRequirements && <JobRequirementsPanel requirements={jobRequirements} />}

      {analyzedCount > 0 && (
        <section className="grid w-full min-w-0 grid-cols-2 border border-black lg:grid-cols-4">
          <div className="min-w-0 border-b border-r border-black p-3 sm:p-5 lg:border-b-0">
            <p className="text-[9px] font-medium leading-tight tracking-[0.15em] text-black/50 sm:text-[10px] sm:tracking-[0.2em]">
              ANALYZED
            </p>
            <p className="mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl">
              {analyzedCount}
            </p>
          </div>
          <div className="min-w-0 border-b border-black p-3 sm:border-r sm:p-5 lg:border-b-0 lg:border-r">
            <p className="text-[9px] font-medium leading-tight tracking-[0.15em] text-black/50 sm:text-[10px] sm:tracking-[0.2em]">
              TOP MATCH
            </p>
            <p className="mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl">
              {topScore}%
            </p>
          </div>
          <div className="min-w-0 border-b border-r border-black p-3 sm:p-5 lg:border-b-0">
            <p className="text-[9px] font-medium leading-tight tracking-[0.15em] text-black/50 sm:text-[10px] sm:tracking-[0.2em]">
              AVERAGE
            </p>
            <p className="mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl">
              {avgScore}%
            </p>
          </div>
          <div className="min-w-0 p-3 sm:p-5">
            <p className="text-[9px] font-medium leading-tight tracking-[0.15em] text-black/50 sm:text-[10px] sm:tracking-[0.2em]">
              STRONG FITS
            </p>
            <p className="mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl">
              {strongMatches}
            </p>
          </div>
        </section>
      )}

      {analyzedCount > 0 && (
        <div className="flex w-full min-w-0 flex-col gap-4 border-b border-black pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight sm:text-xl">
              Ranked candidates
            </h2>
            <p className="mt-1 text-sm text-black/60">
              {hiddenGems > 0 && (
                <span className="mr-2 inline-flex items-center gap-1 font-medium text-amber-700">
                  <Gem className="size-3.5 shrink-0" />
                  {hiddenGems} hidden gem{hiddenGems === 1 ? "" : "s"}
                </span>
              )}
              {demoMode && "· demo mode"}
            </p>
          </div>
          <PillButton
            variant="outline"
            onClick={exportJson}
            disabled={!analyzedCount}
            className="w-full shrink-0 !py-2 sm:w-auto"
          >
            <Download className="mr-2 size-4" />
            EXPORT JSON
          </PillButton>
        </div>
      )}

      {analyzedCount > 0 && (
        <div className="w-full min-w-0 divide-y divide-black border border-black">
          {[...results]
            .sort((a, b) => {
              if (a.isHiddenGem && !b.isHiddenGem) return -1;
              if (!a.isHiddenGem && b.isHiddenGem) return 1;
              return b.score - a.score;
            })
            .map((candidate, index) => (
              <CandidateCard
                key={`${candidate.name}-${candidate.score}-${index}`}
                candidate={candidate}
                rank={index + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}

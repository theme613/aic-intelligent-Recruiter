"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Gem,
  Mail,
  Send,
  Share2,
} from "lucide-react";
import { DimensionBar } from "@/components/DimensionBar";
import { PillButton } from "@/components/PillButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CandidateAnalysis } from "@/lib/gemini";
import { cn } from "@/lib/utils";

function scoreBadgeClass(score: number, isGem: boolean): string {
  if (isGem) return "bg-amber-400 text-black border-amber-600";
  if (score > 70) return "bg-black text-white border-black";
  if (score >= 40) return "bg-[#f4f4f4] text-black border-black";
  return "bg-[#E63946]/10 text-[#E63946] border-[#E63946]";
}

type Props = {
  candidate: CandidateAnalysis;
  rank: number;
};

export function CandidateCard({ candidate, rank }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const isGem = Boolean(candidate.isHiddenGem);
  const topSkills = candidate.matchedSkills.slice(0, 3);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const copyOutreach = async () => {
    await navigator.clipboard.writeText(candidate.outreachMessage);
    showToast("Copied! Paste into LinkedIn InMail");
  };

  return (
    <>
      <article
        className={cn(
          "p-4 sm:p-6 lg:p-8",
          isGem
            ? "border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white"
            : "bg-white",
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            {isGem && (
              <div className="inline-flex w-fit items-center gap-1.5 border border-amber-600 bg-amber-400 px-2.5 py-1 text-[10px] font-bold tracking-[0.2em] text-black shadow-[2px_2px_0_0_#000]">
                <Gem className="size-3.5 shrink-0" aria-hidden />
                HIDDEN GEM
              </div>
            )}
            <p className="text-xs font-medium tracking-[0.2em] text-black/50">
              #{rank}
            </p>
            <h3 className="text-lg font-bold tracking-tight sm:text-xl">
              {candidate.name}
            </h3>
            {candidate.currentTitle && (
              <p className="text-sm font-medium text-black/70">
                {candidate.currentTitle}
              </p>
            )}
            <p className="text-sm leading-relaxed text-black/60">
              {candidate.summary}
            </p>
          </div>
          <span
            className={cn(
              "w-fit shrink-0 self-start rounded-full border px-3 py-1 text-sm font-bold",
              scoreBadgeClass(candidate.score, isGem),
            )}
          >
            {candidate.score}%
          </span>
        </div>

        {isGem && candidate.hiddenGemStory && (
          <div className="mt-5 border-2 border-amber-500 bg-amber-100/80 p-4">
            <p className="text-xs font-bold tracking-[0.2em] text-amber-900">
              WHY WE PROMOTED THEM
            </p>
            <p className="mt-2 text-base font-bold leading-snug text-black">
              {candidate.hiddenGemStory}
            </p>
            {candidate.hiddenGemReason && (
              <p className="mt-2 text-sm leading-relaxed text-black/75">
                {candidate.hiddenGemReason}
              </p>
            )}
            <p className="mt-3 text-xs italic text-black/60">
              Traditional tools would have missed this person. Our agent
              didn&apos;t.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-3 border border-black bg-[#f4f4f4] p-4">
          <DimensionBar label="Hard skill match (30%)" score={candidate.skillScore} />
          <DimensionBar label="Experience relevance (25%)" score={candidate.experienceScore} />
          <DimensionBar label="Domain fit (15%)" score={candidate.domainScore} />
          <DimensionBar label="Seniority alignment (15%)" score={candidate.seniorityScore} />
          <DimensionBar label="Communication (15%)" score={candidate.outreachScore} />
        </div>

        {topSkills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {topSkills.map((skill) => (
              <span
                key={skill}
                className={cn(
                  "border px-2 py-0.5 text-xs font-medium tracking-wide",
                  isGem
                    ? "border-amber-600 bg-amber-50"
                    : "border-black",
                )}
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {candidate.keyStrengths?.length > 0 && (
          <ul className="mt-4 space-y-2 border border-black p-4 text-sm">
            <p className="text-xs font-bold tracking-[0.15em]">KEY STRENGTHS</p>
            {candidate.keyStrengths.map((strength, i) => (
              <li key={i} className="flex gap-2 text-black/80">
                <span className={isGem ? "text-amber-600" : "text-[#E63946]"}>
                  —
                </span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 border border-black p-4">
          <p className="mb-2 text-xs font-bold tracking-[0.15em]">FIT SUMMARY</p>
          <p className="text-sm leading-relaxed text-black/80">
            {candidate.whyThisPerson}
          </p>
        </div>

        <div className="mt-4 border border-black p-4">
          <p className="mb-2 text-xs font-bold tracking-[0.15em] text-[#E63946]">
            GAP ANALYSIS
          </p>
          <p className="text-sm text-black/70">{candidate.skillsGap}</p>
        </div>

        {(candidate.interviewFocusAreas?.length ?? 0) > 0 && (
          <ul className="mt-4 space-y-2 border border-black p-4 text-sm">
            <p className="text-xs font-bold tracking-[0.15em]">INTERVIEW FOCUS</p>
            {candidate.interviewFocusAreas.map((q, i) => (
              <li key={i} className="flex gap-2 text-black/80">
                <span className="font-bold">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 grid gap-0 border border-black sm:grid-cols-2">
          <div className="border-b border-black p-4 sm:border-b-0 sm:border-r">
            <p className="mb-1 text-xs font-bold tracking-[0.15em]">
              MATCHED SKILLS
            </p>
            <p className="text-sm text-black/70">
              {candidate.matchedSkills.length
                ? candidate.matchedSkills.join(", ")
                : "None identified"}
            </p>
          </div>
          <div className="p-4">
            <p className="mb-1 text-xs font-bold tracking-[0.15em]">MISSING</p>
            <p className="text-sm text-black/70">
              {candidate.missingSkills.length
                ? candidate.missingSkills.join(", ")
                : "None identified"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <PillButton
            onClick={() => setOutreachOpen(true)}
            className={cn("flex-1", isGem && "!bg-amber-400 !text-black hover:!bg-amber-300")}
          >
            <Send className="mr-2 size-4" />
            SEND OUTREACH
          </PillButton>
          <PillButton
            variant="outline"
            onClick={() => setExpanded(!expanded)}
            className="flex-1"
          >
            {expanded ? (
              <>
                <ChevronUp className="mr-2 size-4" /> HIDE
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 size-4" /> DETAILS
              </>
            )}
          </PillButton>
        </div>

        {expanded && (
          <div className="mt-4 border border-black bg-[#f4f4f4] p-4 text-sm text-black/70">
            <p>
              <span className="font-bold text-black">Matched: </span>
              {candidate.matchedSkills.join(", ") || "—"}
            </p>
            <p className="mt-2">
              <span className="font-bold text-black">Weighted: </span>
              {candidate.score}/100
            </p>
            {candidate.semanticScore != null && (
              <p className="mt-2">
                <span className="font-bold text-black">Semantic: </span>
                {candidate.semanticScore}
              </p>
            )}
          </div>
        )}
      </article>

      <Dialog open={outreachOpen} onOpenChange={setOutreachOpen}>
        <DialogContent
          className={cn(
            "max-h-[90vh] overflow-y-auto rounded-none border-black bg-white sm:max-w-lg",
            isGem && "border-amber-600",
          )}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold tracking-tight">
              {isGem && <Gem className="size-5 text-amber-600" />}
              Outreach — {candidate.name}
            </DialogTitle>
            <DialogDescription className="text-black/60">
              {isGem
                ? "Hidden gem outreach — opens with the title-mismatch hook"
                : "Personalized message for LinkedIn or email"}
            </DialogDescription>
          </DialogHeader>

          <div
            className={cn(
              "border p-4",
              isGem
                ? "border-amber-500 bg-amber-50"
                : "border-black bg-[#f4f4f4]",
            )}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {candidate.outreachMessage}
            </p>
          </div>

          {(candidate.interviewFocusAreas?.length ?? 0) > 0 && (
            <div className="border border-black bg-white p-4">
              <p className="mb-2 text-xs font-bold tracking-[0.15em]">
                INTERVIEW FOCUS
              </p>
              <ul className="space-y-2 text-sm">
                {candidate.interviewFocusAreas.map((q, i) => (
                  <li key={i}>
                    <span className="text-[#E63946]">{i + 1}.</span> {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {toast && (
            <p className="border border-black bg-black px-3 py-2 text-center text-sm text-white">
              {toast}
            </p>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <PillButton
              variant="outline"
              className="w-full"
              onClick={() => void copyOutreach()}
            >
              <Copy className="mr-2 size-4" />
              COPY TO CLIPBOARD
            </PillButton>
            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#0A66C2] px-6 py-3 text-xs font-semibold tracking-[0.15em] text-white hover:opacity-90"
              onClick={() => void copyOutreach()}
            >
              <Share2 className="mr-2 size-4" />
              SEND VIA LINKEDIN
            </button>
            <Button
              variant="ghost"
              className="w-full rounded-full"
              onClick={() => void copyOutreach()}
            >
              <Mail className="mr-2 size-4" />
              Copy for email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

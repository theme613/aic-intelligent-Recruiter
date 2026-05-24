"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
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

function scoreBadgeClass(score: number): string {
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
      <article className="bg-white p-6 sm:p-8">
        <div className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-[0.2em] text-black/50">
              #{rank}
            </p>
            <h3 className="text-xl font-bold tracking-tight">{candidate.name}</h3>
            <p className="text-sm text-black/60">{candidate.summary}</p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-sm font-bold",
              scoreBadgeClass(candidate.score),
            )}
          >
            {candidate.score}%
          </span>
        </div>

        <div className="mt-6 grid gap-3 border border-black bg-[#f4f4f4] p-4">
          <DimensionBar label="Hard Skills" score={candidate.skillScore} />
          <DimensionBar label="Experience" score={candidate.experienceScore} />
          <DimensionBar label="Domain Fit" score={candidate.domainScore} />
          <DimensionBar label="Seniority" score={candidate.seniorityScore} />
          <DimensionBar label="Comm Fit" score={candidate.outreachScore} />
        </div>

        {topSkills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {topSkills.map((skill) => (
              <span
                key={skill}
                className="border border-black px-2 py-0.5 text-xs font-medium tracking-wide"
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
                <span className="text-[#E63946]">—</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 border border-black p-4">
          <p className="mb-2 text-xs font-bold tracking-[0.15em]">WHY THIS PERSON?</p>
          <p className="text-sm leading-relaxed text-black/80">{candidate.whyThisPerson}</p>
        </div>

        <div className="mt-4 grid gap-0 border border-black sm:grid-cols-2">
          <div className="border-b border-black p-4 sm:border-b-0 sm:border-r">
            <p className="mb-1 text-xs font-bold tracking-[0.15em] text-[#E63946]">
              SKILLS GAP
            </p>
            <p className="text-sm text-black/70">{candidate.skillsGap}</p>
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
          <PillButton onClick={() => setOutreachOpen(true)} className="flex-1">
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
          </div>
        )}
      </article>

      <Dialog open={outreachOpen} onOpenChange={setOutreachOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-black bg-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-bold tracking-tight">
              Outreach — {candidate.name}
            </DialogTitle>
            <DialogDescription className="text-black/60">
              Personalized message for LinkedIn or email
            </DialogDescription>
          </DialogHeader>

          <div className="border border-black bg-[#f4f4f4] p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {candidate.outreachMessage}
            </p>
          </div>

          <div className="border border-black bg-white p-4">
            <p className="text-sm">
              <span className="text-[#E63946]">💡</span> Interview tip:{" "}
              {candidate.interviewFocus}
            </p>
          </div>

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

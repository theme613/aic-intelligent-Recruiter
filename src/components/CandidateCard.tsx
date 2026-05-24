"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CandidateAnalysis } from "@/lib/gemini";
import { cn } from "@/lib/utils";

function scoreBadgeClass(score: number): string {
  if (score > 70) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
  if (score >= 40) return "bg-amber-500/20 text-amber-400 border-amber-500/40";
  return "bg-red-500/20 text-red-400 border-red-500/40";
}

type Props = {
  candidate: CandidateAnalysis;
  rank: number;
};

export function CandidateCard({ candidate, rank }: Props) {
  const [expanded, setExpanded] = useState(false);
  const topSkills = candidate.matchedSkills.slice(0, 3);

  return (
    <Card className="border-gray-800 bg-gray-900/80 transition-shadow hover:shadow-lg hover:shadow-violet-500/5">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            #{rank}
          </p>
          <CardTitle className="text-lg text-white">{candidate.name}</CardTitle>
          <p className="text-sm text-gray-400">{candidate.summary}</p>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 text-sm font-semibold", scoreBadgeClass(candidate.score))}
        >
          {candidate.score}% match
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {topSkills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topSkills.map((skill) => (
              <Badge
                key={skill}
                className="border-violet-500/30 bg-violet-500/15 text-violet-300"
              >
                {skill}
              </Badge>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-gray-800 bg-gray-950/60 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-400">
            Why this person?
          </p>
          <p className="text-sm leading-relaxed text-gray-300">{candidate.whyThisPerson}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-800 p-3">
            <p className="mb-1 text-xs font-semibold text-amber-400">Skills gap</p>
            <p className="text-sm text-gray-400">{candidate.skillsGap}</p>
          </div>
          <div className="rounded-lg border border-gray-800 p-3">
            <p className="mb-1 text-xs font-semibold text-gray-400">Missing skills</p>
            <p className="text-sm text-gray-500">
              {candidate.missingSkills.length
                ? candidate.missingSkills.join(", ")
                : "None identified"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
          <p className="mb-1 text-xs font-semibold text-violet-300">Outreach draft</p>
          <p className="text-sm italic text-gray-300">{candidate.outreachMessage}</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full text-gray-400 hover:text-white"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="mr-2 size-4" /> Hide full analysis
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 size-4" /> View full analysis
            </>
          )}
        </Button>

        {expanded && (
          <div className="animate-in fade-in space-y-2 rounded-lg border border-gray-800 bg-gray-950 p-4 text-sm text-gray-400">
            <p>
              <span className="font-medium text-gray-300">All matched skills: </span>
              {candidate.matchedSkills.join(", ") || "—"}
            </p>
            <p>
              <span className="font-medium text-gray-300">Score breakdown: </span>
              {candidate.score}/100 semantic fit via AI recruiter analysis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

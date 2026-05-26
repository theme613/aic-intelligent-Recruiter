"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Gem,
  HelpCircle,
  Mail,
  Send,
  Share2,
  XCircle,
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
import type { CompanyCheck, ConsistencyFlag, TrustSignal } from "@/lib/agent/types";
import { cn } from "@/lib/utils";

function signalIcon(status: TrustSignal["status"]) {
  if (status === "verified")
    return <CheckCircle2 className="mt-px size-3.5 shrink-0 text-emerald-600" />;
  if (status === "inconsistent")
    return <XCircle className="mt-px size-3.5 shrink-0 text-[#E63946]" />;
  return <HelpCircle className="mt-px size-3.5 shrink-0 text-black/40" />;
}

function signalRowClass(status: TrustSignal["status"]) {
  if (status === "verified") return "border-emerald-200 bg-emerald-50/60";
  if (status === "inconsistent") return "border-red-200 bg-red-50/60";
  return "border-black/10 bg-[#f9f9f9]";
}

function veracityBadge(v: "high" | "medium" | "low") {
  if (v === "high")
    return (
      <span className="border border-emerald-600 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-widest text-emerald-700">
        HIGH CONFIDENCE
      </span>
    );
  if (v === "medium")
    return (
      <span className="border border-amber-500 bg-amber-50 px-2 py-0.5 text-[10px] font-bold tracking-widest text-amber-700">
        REVIEW RECOMMENDED
      </span>
    );
  return (
    <span className="border border-[#E63946] bg-red-50 px-2 py-0.5 text-[10px] font-bold tracking-widest text-[#E63946]">
      VERIFY BEFORE PROGRESSING
    </span>
  );
}

function companyStatusIcon(status: CompanyCheck["status"]) {
  if (status === "confirmed")
    return <CheckCircle2 className="mt-px size-3.5 shrink-0 text-emerald-600" />;
  if (status === "likely")
    return <HelpCircle className="mt-px size-3.5 shrink-0 text-amber-500" />;
  if (status === "not_found")
    return <XCircle className="mt-px size-3.5 shrink-0 text-[#E63946]" />;
  return <HelpCircle className="mt-px size-3.5 shrink-0 text-black/30" />;
}

function flagIcon(severity: ConsistencyFlag["severity"]) {
  if (severity === "warning")
    return <XCircle className="mt-px size-3.5 shrink-0 text-[#E63946]" />;
  return <HelpCircle className="mt-px size-3.5 shrink-0 text-amber-500" />;
}

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

        {/* ── Trust Signals ─────────────────────────────────────────────── */}
        {(candidate.trustSignals?.length ?? 0) > 0 && (
          <div className="mt-5 border border-black p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-bold tracking-[0.15em]">
                TRUST SIGNALS
              </p>
              <div className="flex items-center gap-2 text-[10px] text-black/50">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-emerald-600" /> verified
                </span>
                <span className="flex items-center gap-1">
                  <HelpCircle className="size-3 text-black/40" /> partial
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="size-3 text-[#E63946]" /> inconsistent
                </span>
              </div>
            </div>
            <ul className="space-y-2">
              {candidate.trustSignals!.map((sig, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex items-start gap-2 border px-3 py-2 text-xs",
                    signalRowClass(sig.status),
                  )}
                >
                  {signalIcon(sig.status)}
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold">{sig.label}</span>
                    {sig.detail && (
                      <span className="ml-1 text-black/60">— {sig.detail}</span>
                    )}
                  </div>
                  {sig.url && (
                    <a
                      href={sig.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-black/40 hover:text-black"
                      title={sig.url}
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </li>
              ))}
            </ul>

            {/* Quick links bar */}
            {(candidate.githubUrl || candidate.linkedinUrl || candidate.portfolioUrl) && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-black/10 pt-3">
                {candidate.githubUrl && (
                  <a
                    href={candidate.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 border border-black px-2.5 py-1 text-[10px] font-medium tracking-wide hover:bg-black hover:text-white"
                  >
                    <ExternalLink className="size-3" /> GITHUB
                  </a>
                )}
                {candidate.linkedinUrl && (
                  <a
                    href={candidate.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 border border-[#0A66C2] px-2.5 py-1 text-[10px] font-medium tracking-wide text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white"
                  >
                    <ExternalLink className="size-3" /> LINKEDIN
                  </a>
                )}
                {candidate.portfolioUrl && (
                  <a
                    href={candidate.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 border border-black/40 px-2.5 py-1 text-[10px] font-medium tracking-wide hover:border-black hover:bg-black hover:text-white"
                  >
                    <ExternalLink className="size-3" /> PORTFOLIO
                  </a>
                )}
              </div>
            )}

            {/* Top GitHub repos */}
            {(candidate.githubTopRepos?.length ?? 0) > 0 && (
              <div className="mt-3 border-t border-black/10 pt-3">
                <p className="mb-2 text-[10px] font-bold tracking-[0.15em] text-black/50">
                  TOP GITHUB PROJECTS
                </p>
                <ul className="space-y-1.5">
                  {candidate.githubTopRepos!.map((repo) => (
                    <li key={repo.url} className="flex items-start gap-2 text-xs">
                      <span className="mt-px text-black/30">—</span>
                      <div className="min-w-0 flex-1">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold hover:underline"
                        >
                          {repo.name}
                        </a>
                        {repo.language && (
                          <span className="ml-2 text-[10px] text-black/50">
                            {repo.language}
                          </span>
                        )}
                        {repo.stars > 0 && (
                          <span className="ml-2 text-[10px] text-black/50">
                            ★{repo.stars}
                          </span>
                        )}
                        {repo.description && (
                          <p className="mt-0.5 text-black/60">
                            {repo.description.slice(0, 90)}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Fact Check ────────────────────────────────────────────────── */}
        {candidate.factCheck && (
          <div className="mt-5 border border-black p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold tracking-[0.15em]">FACT CHECK</p>
              {veracityBadge(candidate.factCheck.overallVeracity)}
            </div>

            {/* Summary */}
            <p className="mb-3 text-xs leading-relaxed text-black/70">
              {candidate.factCheck.summary}
            </p>

            {/* Consistency flags */}
            {candidate.factCheck.consistencyFlags.length > 0 && (
              <div className="mb-3">
                <p className="mb-1.5 text-[10px] font-bold tracking-[0.15em] text-black/50">
                  CONSISTENCY FLAGS
                </p>
                <ul className="space-y-1.5">
                  {candidate.factCheck.consistencyFlags.map((flag, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex items-start gap-2 border px-3 py-2 text-xs",
                        flag.severity === "warning"
                          ? "border-red-200 bg-red-50/60"
                          : "border-amber-200 bg-amber-50/60",
                      )}
                    >
                      {flagIcon(flag.severity)}
                      <div>
                        <span className="font-semibold italic">
                          &ldquo;{flag.claim}&rdquo;
                        </span>
                        <span className="ml-1 text-black/60">— {flag.reason}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Company checks */}
            {candidate.factCheck.companyChecks.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-bold tracking-[0.15em] text-black/50">
                  EMPLOYER VERIFICATION
                </p>
                <ul className="space-y-2">
                  {candidate.factCheck.companyChecks.map((co, i) => (
                    <li
                      key={i}
                      className={cn(
                        "border px-3 py-2 text-xs",
                        co.status === "confirmed"
                          ? "border-emerald-200 bg-emerald-50/60"
                          : co.status === "not_found"
                            ? "border-red-200 bg-red-50/60"
                            : "border-black/10 bg-[#f9f9f9]",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {companyStatusIcon(co.status)}
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold">{co.name}</span>
                          {co.dates !== "unknown dates" && (
                            <span className="ml-2 text-black/50">{co.dates}</span>
                          )}
                          <p className="mt-0.5 text-black/60">{co.note}</p>

                          {/* Action links */}
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {co.website && (
                              <a
                                href={co.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 underline hover:no-underline"
                              >
                                <ExternalLink className="size-3" /> Website
                              </a>
                            )}
                            {co.contactPage && (
                              <a
                                href={co.contactPage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "inline-flex items-center gap-1 font-semibold underline hover:no-underline",
                                  co.status === "not_found" && "text-[#E63946]",
                                )}
                              >
                                <ExternalLink className="size-3" />
                                {co.status === "not_found"
                                  ? "Find contact & call to verify"
                                  : "Contact page"}
                              </a>
                            )}
                            {co.status === "not_found" && !co.contactPage && (
                              <span className="text-[#E63946]">
                                Search &ldquo;{co.name} HR contact&rdquo; to verify manually
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 grid gap-3 border border-black bg-[#f4f4f4] p-4">
          <p className="text-xs font-bold tracking-[0.15em] text-black/50">AI DIMENSION SCORES</p>
          <DimensionBar label="Hard skill match" score={candidate.skillScore} />
          <DimensionBar label="Experience relevance" score={candidate.experienceScore} />
          <DimensionBar label="Domain fit" score={candidate.domainScore} />
          <DimensionBar label="Seniority alignment" score={candidate.seniorityScore} />
          <DimensionBar label="Communication quality" score={candidate.outreachScore} />
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

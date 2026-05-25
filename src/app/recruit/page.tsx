"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { FileUpload, type UploadedCandidate } from "@/components/FileUpload";
import { JobForm, type JobFormData } from "@/components/JobForm";
import { PillButton } from "@/components/PillButton";
import { ResultsPanel } from "@/components/ResultsPanel";
import { SiteHeader } from "@/components/SiteHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CandidateAnalysis } from "@/lib/gemini";
import type { JobRequirements } from "@/lib/agent/types";
import {
  demoCandidates,
  demoJob,
  parseRequiredSkills,
} from "@/lib/demoData";

const emptyJob: JobFormData = {
  jobTitle: "",
  company: "",
  requiredSkills: "",
  experienceLevel: "Mid",
  jobDescription: "",
};

export default function RecruitPage() {
  const [tab, setTab] = useState("job");
  const [job, setJob] = useState<JobFormData>(emptyJob);
  const [candidates, setCandidates] = useState<UploadedCandidate[]>([]);
  const [results, setResults] = useState<CandidateAnalysis[]>([]);
  const [jobRequirements, setJobRequirements] = useState<JobRequirements | null>(
    null,
  );
  const [reasoningLog, setReasoningLog] = useState<string[]>([]);
  const [hiddenGemsFound, setHiddenGemsFound] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1") {
      loadDemoData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) return;
    setProgress(8);
    const interval = setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + Math.random() * 12));
    }, 400);
    return () => clearInterval(interval);
  }, [loading]);

  const loadDemoData = () => {
    setJob({
      jobTitle: demoJob.jobTitle,
      company: demoJob.company,
      requiredSkills: demoJob.requiredSkills,
      experienceLevel: demoJob.experienceLevel,
      jobDescription: demoJob.jobDescription,
    });
    setCandidates(
      demoCandidates.map((c) => ({
        id: crypto.randomUUID(),
        name: c.name,
        resumeText: c.resumeText,
      })),
    );
    setDemoMode(true);
    setTab("upload");
    setResults([]);
    setJobRequirements(null);
    setReasoningLog([]);
    setHiddenGemsFound(0);
    setElapsedSeconds(null);
    setError(null);
  };

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setResults([]);
    setJobRequirements(null);
    setReasoningLog([]);
    setHiddenGemsFound(0);
    setElapsedSeconds(null);
    setTab("results");

    const total = candidates.length;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.jobTitle,
          company: job.company,
          requiredSkills: parseRequiredSkills(job.requiredSkills),
          experienceLevel: job.experienceLevel,
          jobDescription: job.jobDescription,
          candidates: candidates.map((c) => ({
            name: c.name,
            resumeText: c.resumeText,
          })),
          demoMode,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error ?? "Analysis failed",
        );
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Streaming not supported in this browser");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as {
            type: string;
            result?: CandidateAnalysis;
            data?: JobRequirements;
            message?: string;
            promoted?: string[];
            count?: number;
            total?: number;
            hiddenGems?: number;
            elapsedSeconds?: number;
            demo?: boolean;
            error?: string;
          };

          if (event.type === "log" && event.message) {
            setReasoningLog((prev) => [...prev, event.message!]);
          }

          if (event.type === "job_requirements" && event.data) {
            setJobRequirements(event.data);
          }

          if (event.type === "hidden_gems") {
            setHiddenGemsFound(event.count ?? event.promoted?.length ?? 0);
          }

          if (event.type === "stats") {
            setHiddenGemsFound(event.hiddenGems ?? 0);
            setElapsedSeconds(event.elapsedSeconds ?? null);
          }

          if (event.type === "candidate" && event.result) {
            received += 1;
            setResults((prev) =>
              [...prev, event.result!].sort((a, b) => {
                if (a.isHiddenGem && !b.isHiddenGem) return -1;
                if (!a.isHiddenGem && b.isHiddenGem) return 1;
                return b.score - a.score;
              }),
            );
            setProgress(
              total > 0 ? Math.min(95, (received / total) * 100) : 50,
            );
          }

          if (event.type === "done") {
            if (event.demo) setDemoMode(true);
            setProgress(100);
          }

          if (event.type === "error") {
            throw new Error(event.error ?? "Analysis failed");
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, [job, candidates, demoMode]);

  const jobReady = Boolean(
    job.jobTitle.trim() && job.company.trim() && job.jobDescription.trim(),
  );

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white text-black">
      <SiteHeader
        showLogin={false}
        rightSlot={
          <PillButton onClick={loadDemoData} variant="outline" className="!py-2 !text-[10px]">
            <Sparkles className="mr-1.5 size-3.5" />
            LOAD DEMO
          </PillButton>
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 border-x-0 border-black sm:border-x">
        <div className="page-x border-b border-black py-8 sm:py-10">
          <p className="text-xs font-medium tracking-[0.25em] text-black/50">
            DASHBOARD
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Recruitment workspace
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/70">
            Define the role, upload resumes, and let AI rank your best matches.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full gap-0">
          <TabsList
            variant="brutalist"
            className="!inline-grid w-full grid-cols-3 items-stretch"
          >
            <TabsTrigger value="job" className="min-w-0">
              JOB
            </TabsTrigger>
            <TabsTrigger value="upload" disabled={!jobReady} className="min-w-0">
              UPLOAD
            </TabsTrigger>
            <TabsTrigger value="results" className="min-w-0 border-r-0">
              RESULTS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="job" className="page-x mt-0 border-0 py-6 sm:py-10">
            <JobForm
              data={job}
              onChange={setJob}
              onNext={() => setTab("upload")}
            />
          </TabsContent>

          <TabsContent value="upload" className="page-x mt-0 border-0 py-6 sm:py-10">
            <FileUpload
              candidates={candidates}
              onChange={setCandidates}
              onAnalyze={runAnalysis}
              analyzing={loading}
              canAnalyze={jobReady}
            />
          </TabsContent>

          <TabsContent value="results" className="page-x mt-0 border-0 py-6 sm:py-10">
            <ResultsPanel
              results={results}
              jobRequirements={jobRequirements}
              loading={loading}
              progress={progress}
              error={error}
              demoMode={demoMode}
              totalCandidates={candidates.length}
              reasoningLog={reasoningLog}
              hiddenGemsFound={hiddenGemsFound}
              elapsedSeconds={elapsedSeconds}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mx-auto w-full max-w-6xl border-t border-x-0 border-black px-4 py-5 text-center text-xs tracking-widest text-black/50 sm:border-x">
        POWERED BY GOOGLE GEMINI
      </footer>
    </div>
  );
}

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
    setError(null);
  };

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setResults([]);
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
            demo?: boolean;
            error?: string;
          };

          if (event.type === "candidate" && event.result) {
            received += 1;
            setResults((prev) =>
              [...prev, event.result!].sort((a, b) => b.score - a.score),
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
    <div className="flex min-h-screen flex-col bg-white text-black">
      <SiteHeader
        showLogin={false}
        rightSlot={
          <PillButton onClick={loadDemoData} variant="outline" className="!py-2 !text-[10px]">
            <Sparkles className="mr-1.5 size-3.5" />
            LOAD DEMO
          </PillButton>
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 border-x border-black">
        <div className="border-b border-black px-6 py-10 sm:px-10">
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

        <Tabs value={tab} onValueChange={setTab} className="gap-0">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-none border-b border-black bg-white p-0">
            <TabsTrigger
              value="job"
              className="rounded-none border-r border-black py-4 text-xs tracking-[0.15em] data-active:bg-black data-active:text-white"
            >
              JOB
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              disabled={!jobReady}
              className="rounded-none border-r border-black py-4 text-xs tracking-[0.15em] data-active:bg-black data-active:text-white"
            >
              UPLOAD
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="rounded-none py-4 text-xs tracking-[0.15em] data-active:bg-black data-active:text-white"
            >
              RESULTS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="job" className="mt-0 border-0 p-6 sm:p-10">
            <JobForm
              data={job}
              onChange={setJob}
              onNext={() => setTab("upload")}
            />
          </TabsContent>

          <TabsContent value="upload" className="mt-0 border-0 p-6 sm:p-10">
            <FileUpload
              candidates={candidates}
              onChange={setCandidates}
              onAnalyze={runAnalysis}
              analyzing={loading}
              canAnalyze={jobReady}
            />
          </TabsContent>

          <TabsContent value="results" className="mt-0 border-0 p-6 sm:p-10">
            <ResultsPanel
              results={results}
              loading={loading}
              progress={progress}
              error={error}
              demoMode={demoMode}
              totalCandidates={candidates.length}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-black py-5 text-center text-xs tracking-widest text-black/50">
        POWERED BY GOOGLE GEMINI
      </footer>
    </div>
  );
}

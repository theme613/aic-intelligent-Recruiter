"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { FileUpload, type UploadedCandidate } from "@/components/FileUpload";
import { JobForm, type JobFormData } from "@/components/JobForm";
import { ResultsPanel } from "@/components/ResultsPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CandidateAnalysis } from "@/lib/chutes";
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
    setTab("results");

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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Analysis failed");
      }

      setProgress(100);
      setResults(data.results ?? []);
      if (data.demo) setDemoMode(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [job, candidates, demoMode]);

  const jobReady = Boolean(
    job.jobTitle.trim() && job.company.trim() && job.jobDescription.trim(),
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-violet-400">
            ← AI Recruitment Agent
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10"
            onClick={loadDemoData}
          >
            <Sparkles className="mr-2 size-4" />
            Load Demo Data
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Recruitment Dashboard
          </h1>
          <p className="mt-2 text-gray-400">
            Define the role, upload resumes, and let AI rank your best matches.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 border border-gray-800 bg-gray-900">
            <TabsTrigger value="job">Job Description</TabsTrigger>
            <TabsTrigger value="upload" disabled={!jobReady}>
              Upload Resumes
            </TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent
            value="job"
            className="rounded-xl border border-gray-800 bg-gray-900 p-6"
          >
            <JobForm
              data={job}
              onChange={setJob}
              onNext={() => setTab("upload")}
            />
          </TabsContent>

          <TabsContent
            value="upload"
            className="rounded-xl border border-gray-800 bg-gray-900 p-6"
          >
            <FileUpload
              candidates={candidates}
              onChange={setCandidates}
              onAnalyze={runAnalysis}
              analyzing={loading}
              canAnalyze={jobReady}
            />
          </TabsContent>

          <TabsContent
            value="results"
            className="rounded-xl border border-gray-800 bg-gray-900 p-6"
          >
            <ResultsPanel
              results={results}
              loading={loading}
              progress={progress}
              error={error}
              demoMode={demoMode}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-gray-800 py-6 text-center">
        <span className="inline-flex items-center rounded-full border border-gray-800 bg-gray-900 px-3 py-1 text-xs text-gray-500">
          Powered by Chutes.AI
        </span>
      </footer>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import mammoth from "mammoth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type UploadedCandidate = {
  id: string;
  name: string;
  resumeText: string;
  filename?: string;
};

type Props = {
  candidates: UploadedCandidate[];
  onChange: React.Dispatch<React.SetStateAction<UploadedCandidate[]>>;
  onAnalyze: () => void;
  analyzing: boolean;
  canAnalyze: boolean;
};

function extractNameFromText(text: string, fallback: string): string {
  const firstLine = text.trim().split("\n")[0]?.trim() ?? "";
  if (firstLine.length > 0 && firstLine.length < 60 && !firstLine.includes("@")) {
    return firstLine;
  }
  return fallback;
}

export function FileUpload({
  candidates,
  onChange,
  onAnalyze,
  analyzing,
  canAnalyze,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [manualText, setManualText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCandidate = (name: string, resumeText: string, filename?: string) => {
    onChange((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        resumeText,
        filename,
      },
    ]);
  };

  const processFile = async (file: File) => {
      setError(null);
      setParsing(true);
      try {
        const ext = file.name.split(".").pop()?.toLowerCase();

        if (ext === "pdf") {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/parse-pdf", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "PDF parse failed");
          const name = extractNameFromText(data.text, file.name.replace(/\.[^.]+$/, ""));
          addCandidate(name, data.text, data.filename);
        } else if (ext === "txt") {
          const text = await file.text();
          const name = extractNameFromText(text, file.name.replace(/\.[^.]+$/, ""));
          addCandidate(name, text, file.name);
        } else if (ext === "docx") {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          const name = extractNameFromText(result.value, file.name.replace(/\.[^.]+$/, ""));
          addCandidate(name, result.value, file.name);
        } else {
          throw new Error("Unsupported file type. Use .pdf, .txt, or .docx");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process file");
      } finally {
        setParsing(false);
      }
    };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      await processFile(file);
    }
  };

  const removeCandidate = (id: string) => {
    onChange(candidates.filter((c) => c.id !== id));
  };

  const addManual = () => {
    if (!manualText.trim()) return;
    const name = extractNameFromText(manualText, `Candidate ${candidates.length + 1}`);
    addCandidate(name, manualText.trim());
    setManualText("");
  };

  return (
    <div className="space-y-6">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors",
          dragOver
            ? "border-violet-500 bg-violet-500/10"
            : "border-gray-700 bg-gray-950/50 hover:border-violet-500/50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        {parsing ? (
          <Loader2 className="mb-3 size-10 animate-spin text-violet-400" />
        ) : (
          <Upload className="mb-3 size-10 text-violet-400" />
        )}
        <p className="text-center font-medium text-white">
          Drag & drop resumes here
        </p>
        <p className="mt-1 text-center text-sm text-gray-500">
          PDF, TXT, or DOCX — click to browse
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {candidates.length > 0 && (
        <ul className="space-y-2">
          {candidates.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="size-5 shrink-0 text-violet-400" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{c.name}</p>
                  {c.filename && (
                    <p className="truncate text-xs text-gray-500">{c.filename}</p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-gray-400 hover:text-red-400"
                onClick={() => removeCandidate(c.id)}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 rounded-xl border border-gray-800 bg-gray-950/50 p-4">
        <p className="text-sm font-medium text-gray-300">Or paste resume text</p>
        <Textarea
          placeholder="Paste raw resume content..."
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          className="min-h-[120px] border-gray-800 bg-gray-900"
        />
        <Button
          type="button"
          variant="outline"
          className="border-gray-700"
          onClick={addManual}
          disabled={!manualText.trim()}
        >
          Add Manually
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Badge variant="outline" className="w-fit border-violet-500/40 text-violet-300">
          {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
        </Badge>
        <Button
          onClick={onAnalyze}
          disabled={!canAnalyze || analyzing || candidates.length === 0}
          className="bg-violet-600 hover:bg-violet-500"
        >
          {analyzing ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Candidates"
          )}
        </Button>
      </div>
    </div>
  );
}

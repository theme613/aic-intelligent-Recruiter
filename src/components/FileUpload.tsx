"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import mammoth from "mammoth";
import { PillButton } from "@/components/PillButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseApiJson } from "@/lib/api-response";
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
          const data = await parseApiJson<{
            text?: string;
            filename?: string;
            error?: string;
          }>(res);
          if (!res.ok) throw new Error(data.error ?? "PDF parse failed");
          if (!data.text?.trim()) {
            throw new Error("PDF parsed but no text was extracted.");
          }
          const name = extractNameFromText(
            data.text,
            file.name.replace(/\.[^.]+$/, ""),
          );
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
          "flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-black bg-[#f4f4f4] p-10 transition-colors",
          dragOver && "bg-[#e5e5e5]",
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
          <Loader2 className="mb-3 size-10 animate-spin text-black" />
        ) : (
          <Upload className="mb-3 size-10 text-black" />
        )}
        <p className="text-center text-sm font-bold tracking-[0.15em]">
          DRAG & DROP RESUMES
        </p>
        <p className="mt-1 text-center text-sm text-black/60">
          PDF, TXT, or DOCX — click to browse
        </p>
      </div>

      {error && (
        <p className="border border-[#E63946] bg-[#E63946]/10 px-4 py-2 text-sm text-[#E63946]">
          {error}
        </p>
      )}

      {candidates.length > 0 && (
        <ul className="space-y-2">
          {candidates.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between border border-black bg-white px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="size-5 shrink-0 text-black" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  {c.filename && (
                    <p className="truncate text-xs text-black/50">{c.filename}</p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 hover:text-[#E63946]"
                onClick={() => removeCandidate(c.id)}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 border border-black bg-[#f4f4f4] p-4">
        <p className="text-xs font-medium tracking-[0.15em]">OR PASTE RESUME TEXT</p>
        <Textarea
          placeholder="Paste raw resume content..."
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          className="min-h-[120px] rounded-none border-black bg-white"
        />
        <PillButton
          variant="outline"
          onClick={addManual}
          disabled={!manualText.trim()}
          className="!py-2"
        >
          ADD MANUALLY
        </PillButton>
      </div>

      <div className="flex flex-col gap-4 border-t border-black pt-6 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-medium tracking-wide">
          {candidates.length} CANDIDATE{candidates.length !== 1 ? "S" : ""}
        </span>
        {analyzing ? (
          <PillButton disabled className="gap-2">
            <Loader2 className="size-4 animate-spin" />
            ANALYZING…
          </PillButton>
        ) : (
          <PillButton
            onClick={onAnalyze}
            disabled={!canAnalyze || candidates.length === 0}
          >
            ANALYZE CANDIDATES
          </PillButton>
        )}
      </div>
    </div>
  );
}

"use client";

import { PillButton } from "@/components/PillButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type JobFormData = {
  jobTitle: string;
  company: string;
  requiredSkills: string;
  experienceLevel: string;
  jobDescription: string;
};

const fieldClass =
  "h-10 rounded-none border-black bg-white text-black shadow-none placeholder:text-black/40 focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black/20";

type Props = {
  data: JobFormData;
  onChange: (data: JobFormData) => void;
  onNext: () => void;
};

export function JobForm({ data, onChange, onNext }: Props) {
  const update = (patch: Partial<JobFormData>) => onChange({ ...data, ...patch });

  const canProceed =
    data.jobTitle.trim() &&
    data.company.trim() &&
    data.jobDescription.trim();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="jobTitle" className="text-xs tracking-[0.15em]">
            JOB TITLE
          </Label>
          <Input
            id="jobTitle"
            placeholder="e.g. Frontend Developer"
            value={data.jobTitle}
            onChange={(e) => update({ jobTitle: e.target.value })}
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company" className="text-xs tracking-[0.15em]">
            COMPANY
          </Label>
          <Input
            id="company"
            placeholder="e.g. APU AIC Labs"
            value={data.company}
            onChange={(e) => update({ company: e.target.value })}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="skills" className="text-xs tracking-[0.15em]">
          REQUIRED SKILLS
        </Label>
        <Input
          id="skills"
          placeholder="React, TypeScript, Next.js"
          value={data.requiredSkills}
          onChange={(e) => update({ requiredSkills: e.target.value })}
          className={fieldClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience" className="text-xs tracking-[0.15em]">
          EXPERIENCE LEVEL
        </Label>
        <select
          id="experience"
          value={data.experienceLevel}
          onChange={(e) => update({ experienceLevel: e.target.value })}
          className="flex h-10 w-full rounded-none border border-black bg-white px-3 text-sm shadow-none outline-none focus-visible:ring-1 focus-visible:ring-black/20"
        >
          <option value="Junior">Junior</option>
          <option value="Mid">Mid</option>
          <option value="Senior">Senior</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-xs tracking-[0.15em]">
          JOB DESCRIPTION
        </Label>
        <Textarea
          id="description"
          placeholder="Paste the full job description here..."
          value={data.jobDescription}
          onChange={(e) => update({ jobDescription: e.target.value })}
          className={`min-h-[220px] resize-y ${fieldClass}`}
        />
      </div>

      <PillButton onClick={onNext} disabled={!canProceed}>
        NEXT STEP
      </PillButton>
    </div>
  );
}

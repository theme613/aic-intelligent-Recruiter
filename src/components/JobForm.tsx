"use client";

import { Button } from "@/components/ui/button";
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
          <Label htmlFor="jobTitle">Job Title</Label>
          <Input
            id="jobTitle"
            placeholder="e.g. Frontend Developer"
            value={data.jobTitle}
            onChange={(e) => update({ jobTitle: e.target.value })}
            className="border-gray-800 bg-gray-950"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company Name</Label>
          <Input
            id="company"
            placeholder="e.g. APU AIC Labs"
            value={data.company}
            onChange={(e) => update({ company: e.target.value })}
            className="border-gray-800 bg-gray-950"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="skills">Required Skills (comma separated)</Label>
        <Input
          id="skills"
          placeholder="React, TypeScript, Next.js"
          value={data.requiredSkills}
          onChange={(e) => update({ requiredSkills: e.target.value })}
          className="border-gray-800 bg-gray-950"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience">Experience Level</Label>
        <select
          id="experience"
          value={data.experienceLevel}
          onChange={(e) => update({ experienceLevel: e.target.value })}
          className="flex h-9 w-full rounded-md border border-gray-800 bg-gray-950 px-3 py-1 text-sm text-white shadow-xs outline-none focus-visible:border-violet-500 focus-visible:ring-[3px] focus-visible:ring-violet-500/30"
        >
          <option value="Junior">Junior</option>
          <option value="Mid">Mid</option>
          <option value="Senior">Senior</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Job Description</Label>
        <Textarea
          id="description"
          placeholder="Paste the full job description here..."
          value={data.jobDescription}
          onChange={(e) => update({ jobDescription: e.target.value })}
          className="min-h-[220px] border-gray-800 bg-gray-950 resize-y"
        />
      </div>

      <Button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full bg-violet-600 hover:bg-violet-500 sm:w-auto"
      >
        Next Step
      </Button>
    </div>
  );
}

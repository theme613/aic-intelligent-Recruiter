import type { JobRequirements } from "@/lib/agent/types";

type Props = {
  requirements: JobRequirements;
};

export function JobRequirementsPanel({ requirements }: Props) {
  return (
    <section className="mb-8 border border-black bg-[#f4f4f4]">
      <div className="border-b border-black px-5 py-3">
        <p className="text-xs font-bold tracking-[0.2em]">
          PARSED JOB REQUIREMENTS
        </p>
        <p className="mt-1 text-lg font-bold">{requirements.role_title}</p>
        <p className="text-sm capitalize text-black/60">
          {requirements.seniority_level} · {requirements.domain}
        </p>
      </div>

      <div className="grid sm:grid-cols-2">
        <div className="border-b border-black p-5 sm:border-b-0 sm:border-r">
          <p className="mb-2 text-xs font-bold tracking-[0.15em]">
            MUST-HAVE SKILLS
          </p>
          <div className="flex flex-wrap gap-2">
            {requirements.hard_skills.map((s) => (
              <span
                key={s}
                className="border border-black bg-white px-2 py-0.5 text-xs font-medium"
              >
                {s}
              </span>
            ))}
          </div>
          {requirements.soft_skills.length > 0 && (
            <>
              <p className="mb-2 mt-4 text-xs font-bold tracking-[0.15em]">
                NICE-TO-HAVE
              </p>
              <div className="flex flex-wrap gap-2">
                {requirements.soft_skills.map((s) => (
                  <span
                    key={s}
                    className="border border-black/40 px-2 py-0.5 text-xs text-black/70"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-5">
          <p className="mb-2 text-xs font-bold tracking-[0.15em]">
            RESPONSIBILITIES
          </p>
          <ul className="space-y-1 text-sm text-black/80">
            {requirements.responsibilities.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[#E63946]">—</span>
                {r}
              </li>
            ))}
          </ul>
          {requirements.title_keywords.length > 0 && (
            <>
              <p className="mb-2 mt-4 text-xs font-bold tracking-[0.15em]">
                TITLE KEYWORDS (bias watch)
              </p>
              <div className="flex flex-wrap gap-2">
                {requirements.title_keywords.map((k) => (
                  <span
                    key={k}
                    className="border border-amber-600 bg-amber-50 px-2 py-0.5 text-xs"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </>
          )}
          {requirements.hard_constraints.length > 0 && (
            <>
              <p className="mb-2 mt-4 text-xs font-bold tracking-[0.15em] text-[#E63946]">
                CONSTRAINTS
              </p>
              <ul className="space-y-1 text-sm">
                {requirements.hard_constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

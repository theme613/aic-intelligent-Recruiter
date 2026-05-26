/**
 * Step 2.6 — Fact Check
 *
 * Two sub-checks per candidate (both non-blocking):
 *  A) AI consistency check  — Gemini 2.0 Flash scans for internal resume
 *     contradictions, impossible date math, inflated claims.
 *  B) Company lookup         — Clearbit Autocomplete (free, no auth key)
 *     verifies each employer is a real organisation and surfaces a contact
 *     page URL + phone so a recruiter can call to confirm employment.
 *
 * Both run in parallel. Either can fail gracefully without blocking the rest
 * of the pipeline.
 */

import { generateWithRetry, getModel, parseJson } from "./llm";
import { mapConcurrent } from "./retry";
import type {
  Candidate,
  CompanyCheck,
  CompanyCheckStatus,
  ConsistencyFlag,
  FactCheckReport,
} from "./types";

// ── A) AI Consistency check ───────────────────────────────────────────────

type RawConsistencyResult = {
  overall_veracity: "high" | "medium" | "low";
  flags: Array<{ severity: "warning" | "info"; claim: string; reason: string }>;
  summary: string;
};

async function checkConsistency(
  candidate: Candidate,
): Promise<Pick<FactCheckReport, "overallVeracity" | "consistencyFlags" | "summary">> {
  const fallback = {
    overallVeracity: "medium" as const,
    consistencyFlags: [],
    summary: "Consistency check unavailable — review resume manually.",
  };

  try {
    const model = getModel("fact_check");
    const prompt = `
Analyse this resume for internal inconsistencies or suspicious claims.

Check:
1. Date math — do the employment periods add up? Are total years of experience plausible given graduation year?
2. Contradictions — does any claim contradict another (e.g. title says junior but claims to have managed a team of 20)?
3. Inflated claims — metrics that seem statistically improbable (e.g. "improved performance by 10,000%").
4. Gaps — unexplained gaps > 12 months without freelance/study explanation.
5. Certifications — any mentioned without a verifiable URL or credential ID.

Return JSON with this exact structure:
{
  "overall_veracity": "high" | "medium" | "low",
  "flags": [
    { "severity": "warning" | "info", "claim": "<exact quote from resume>", "reason": "<why it's suspicious>" }
  ],
  "summary": "<one sentence overall assessment>"
}

If everything looks fine, return overall_veracity "high" with an empty flags array.

RESUME:
${candidate.raw_resume}
`.trim();

    const result = await generateWithRetry(model, prompt, `fact-check:${candidate.name}`);
    const parsed = parseJson<RawConsistencyResult>(result.response.text());

    return {
      overallVeracity: parsed.overall_veracity ?? "medium",
      consistencyFlags: (parsed.flags ?? []).map((f) => ({
        severity: f.severity ?? "info",
        claim: f.claim ?? "",
        reason: f.reason ?? "",
      })),
      summary: parsed.summary ?? fallback.summary,
    };
  } catch (err) {
    console.error("[fact-check] consistency check failed for", candidate.name, err);
    return fallback;
  }
}

// ── B) Company lookup ────────────────────────────────────────────────────

/** Names that are too generic to look up meaningfully */
const SKIP_NAMES = new Set([
  "freelance", "self-employed", "self employed", "contractor",
  "consulting", "various clients", "internship", "startup",
  "part-time", "volunteer",
]);

interface ClearbitSuggestion {
  name: string;
  domain: string;
  logo?: string;
}

async function clearbitLookup(name: string): Promise<ClearbitSuggestion | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(name)}`,
      { signal: controller.signal },
    );
    clearTimeout(id);
    if (!res.ok) return null;
    const data = (await res.json()) as ClearbitSuggestion[];
    if (!Array.isArray(data) || data.length === 0) return null;
    // Pick best match — prefer exact name match, otherwise first result
    const exact = data.find(
      (d) => d.name.toLowerCase() === name.toLowerCase(),
    );
    return exact ?? data[0];
  } catch {
    return null;
  }
}

/** Try to find a contact page on the company domain */
function buildContactUrl(domain: string): string {
  return `https://${domain}/contact`;
}

async function checkCompany(
  name: string,
  dates: string,
): Promise<CompanyCheck> {
  const normalised = name.trim();

  if (SKIP_NAMES.has(normalised.toLowerCase())) {
    return {
      name: normalised,
      dates,
      status: "skipped",
      note: "Self-reported / generic employer — no lookup needed.",
    };
  }

  const hit = await clearbitLookup(normalised);

  if (!hit) {
    return {
      name: normalised,
      dates,
      status: "not_found",
      note: `"${normalised}" not found in public company registry. Call their HR to verify — search "${normalised} careers" for contact details.`,
    };
  }

  const isExact = hit.name.toLowerCase() === normalised.toLowerCase();
  const status: CompanyCheckStatus = isExact ? "confirmed" : "likely";
  const domain = hit.domain;
  const website = `https://${domain}`;
  const contactPage = buildContactUrl(domain);

  return {
    name: normalised,
    dates,
    status,
    domain,
    website,
    contactPage,
    note: isExact
      ? `Confirmed — ${hit.name} (${domain}) found in public records.`
      : `Likely match: ${hit.name} (${domain}) — verify it is the same company.`,
  };
}

// ── Extract employers from parsed candidate ───────────────────────────────

/**
 * Pull employer names and rough dates from the raw resume text using a
 * simple heuristic (looks for "Company — Role (dates)" patterns) before
 * falling back to the AI-parsed top_projects/seniority_signals.
 */
function extractEmployersFromResume(
  candidate: Candidate,
): Array<{ name: string; dates: string }> {
  // Pattern: "— Company Name (YYYY–YYYY)" or "Company Name (YYYY–Present)"
  const LINE_RE =
    /(?:^|\n)[^\n]*?(?:—|@|at)\s+([A-Z][A-Za-z0-9 &.,'-]{1,50})\s+\((\d{4}[–\-–]\d{4}|\d{4}[–\-–]Present)\)/g;
  const DATE_LINE_RE =
    /^([A-Z][A-Za-z0-9 &.,'-]{2,50})\s*[\|·]\s*(\d{4}\s*[–\-–]\s*(?:\d{4}|Present))/gm;

  const seen = new Set<string>();
  const employers: Array<{ name: string; dates: string }> = [];

  const addIfNew = (name: string, dates: string) => {
    const key = name.toLowerCase().trim();
    if (!seen.has(key) && name.length > 2) {
      seen.add(key);
      employers.push({ name: name.trim(), dates: dates.trim() });
    }
  };

  for (const m of candidate.raw_resume.matchAll(LINE_RE)) {
    addIfNew(m[1], m[2]);
  }
  for (const m of candidate.raw_resume.matchAll(DATE_LINE_RE)) {
    addIfNew(m[1], m[2]);
  }

  // Fallback — use seniority_signals which often encode company names
  if (employers.length === 0) {
    for (const signal of candidate.seniority_signals) {
      const m = signal.match(/at\s+([A-Z][A-Za-z0-9 &.,'-]{2,40})/);
      if (m) addIfNew(m[1], "unknown dates");
    }
  }

  return employers.slice(0, 5); // cap at 5 employers
}

// ── Main entry point ──────────────────────────────────────────────────────

export async function factCheckCandidate(
  candidate: Candidate,
): Promise<Candidate> {
  const employers = extractEmployersFromResume(candidate);

  const [consistencyResult, companyChecks] = await Promise.all([
    checkConsistency(candidate),
    Promise.all(employers.map((e) => checkCompany(e.name, e.dates))),
  ]);

  const warningCount = consistencyResult.consistencyFlags.filter(
    (f) => f.severity === "warning",
  ).length;
  const unverifiedCompanies = companyChecks.filter(
    (c) => c.status === "not_found",
  ).length;

  // Re-evaluate overall veracity if company checks reveal issues
  let overallVeracity = consistencyResult.overallVeracity;
  if (unverifiedCompanies > 0 && overallVeracity === "high") {
    overallVeracity = "medium";
  }
  if (warningCount >= 2 || (warningCount >= 1 && unverifiedCompanies >= 1)) {
    overallVeracity = "low";
  }

  const factCheck: FactCheckReport = {
    overallVeracity,
    consistencyFlags: consistencyResult.consistencyFlags,
    companyChecks,
    summary:
      consistencyResult.summary ||
      (overallVeracity === "high"
        ? "No inconsistencies found — resume appears internally consistent."
        : overallVeracity === "medium"
          ? `${warningCount} flag(s) detected. ${unverifiedCompanies} employer(s) unverified — manual follow-up recommended.`
          : "Multiple red flags detected — recommend manual verification before progressing."),
  };

  return { ...candidate, factCheck };
}

/** Run fact-check for all candidates with concurrency limiting. */
export async function factCheckCandidates(
  candidates: Candidate[],
): Promise<Candidate[]> {
  return mapConcurrent(candidates, (c) => factCheckCandidate(c));
}

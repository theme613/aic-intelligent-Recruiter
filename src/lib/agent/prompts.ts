/**
 * All LLM prompt templates as constants (mirrors Python prompts.py).
 */

export const PROMPT_PARSE_JD = (params: {
  jobTitle: string;
  experienceLevel: string;
  skillsHint: string;
  jdText: string;
}) => `Parse this job description into structured fields.

Form hints (use only to disambiguate, prefer JD text itself):
- title hint: ${params.jobTitle || "(none)"}
- seniority hint: ${params.experienceLevel || "(none)"}
- skills hint: ${params.skillsHint || "(none)"}

JOB DESCRIPTION:
${params.jdText}

Return JSON exactly:
{
  "role_title": "string",
  "seniority_level": "junior|mid|senior|lead|manager",
  "hard_skills": ["normalized lowercase must-have technical skills"],
  "soft_skills": ["nice-to-have, lowercase"],
  "domain": "fintech|healthtech|saas|edtech|etc",
  "responsibilities": ["top 5 responsibility strings"],
  "hard_constraints": ["dealbreakers like 'must be in KL', or empty array"],
  "title_keywords": ["exact title words that would appear on a matching candidate's job title — e.g. frontend, developer, engineer — used to detect title bias"]
}`;

export const PROMPT_PARSE_CANDIDATE = (params: {
  hintName: string;
  resumeText: string;
  titleKeywords: string;
}) => `Parse this resume into structured fields. Normalize skill synonyms (e.g. "ML pipelines"="machine learning", "Postgres"="sql"). Use lowercase for skills and domain_exposure.

Candidate name hint: ${params.hintName}
JD title keywords for reference: ${params.titleKeywords}

RESUME:
${params.resumeText}

Return JSON exactly:
{
  "name": "full name",
  "current_title": "current job title",
  "years_experience": number,
  "skills": ["normalized lowercase skills"],
  "top_projects": [
    {"title": "string", "summary": "1-sentence outcome-focused summary", "stack": ["technologies"], "impact": "measurable outcome if any"}
  ],
  "domain_exposure": ["industries worked in, lowercase"],
  "seniority_signals": ["ownership/leadership signals quoted from resume"],
  "education": "highest degree + field"
}

Constraints: max 3 top_projects.`;

export const PROMPT_HIDDEN_GEM_DETECTION = (params: {
  jdJson: string;
  top5Json: string;
  potentialGemsJson: string;
}) => `You are a senior recruiter reviewing an AI-generated candidate shortlist.

Here is the job description requirements:
${params.jdJson}

Here is the current top 5 shortlist:
${params.top5Json}

Here are candidates who were ranked LOWER but flagged because their work evidence strongly matches the JD despite having a different job title:
${params.potentialGemsJson}

Your task:
1. For each flagged candidate, decide: should they be promoted into the shortlist? Answer YES or NO with a one-sentence reason.
2. If YES, specify which current top-5 candidate they should replace (if any), or if they should be added as an additional recommendation (add_additional: true).
3. For each promoted candidate, write their "Hidden Gem" reason in this format:
   "Ranked low because title says X, but promoted because Y specific evidence"

Be strict — only promote if the evidence is genuinely strong. Traditional keyword tools would have missed these people.

Return JSON exactly:
{
  "promoted_gems": [
    {
      "name": "exact candidate name",
      "promote": true,
      "hidden_gem_reason": "Ranked low because title says X, but promoted because Y",
      "hidden_gem_story": "Title said X. Work said Y. We promoted them.",
      "replace_candidate": "name to replace or null",
      "add_additional": false
    }
  ]
}

Return empty promoted_gems array if no one should be promoted.`;

export const PROMPT_PITCH = (params: {
  jobJson: string;
  candidateJson: string;
  isHiddenGem: boolean;
}) => `Write a recruiter narrative for this candidate against the JD. Cite SPECIFIC resume evidence — projects, skills, ownership signals.
${params.isHiddenGem ? "\nThis candidate is a HIDDEN GEM — promoted despite title mismatch. Emphasize work evidence over title in fit_summary.\n" : ""}

JOB:
${params.jobJson}

CANDIDATE:
${params.candidateJson}

Return JSON exactly:
{
  "fit_summary": "2-3 sentences WHY this person matches — cite specific projects/skills",
  "gap_analysis": "1-2 sentences honest, constructive — what's missing or uncertain",
  "interview_focus": ["3 specific probing questions targeted at gaps/unclear signals"],
  "score_breakdown": {
    "hard_skill_match": 0-100,
    "experience_relevance": 0-100,
    "domain_fit": 0-100,
    "seniority_alignment": 0-100,
    "communication_quality": 0-100
  },
  "matched_skills": ["hard skills evidenced"],
  "missing_skills": ["hard skills not evidenced"],
  "key_strengths": ["3 short evidence bullets from resume"]${params.isHiddenGem ? ',\n  "hidden_gem_story": "Title said X. Work said Y. We promoted them."' : ""}
}`;

export const PROMPT_OUTREACH = (params: {
  company: string;
  firstName: string;
  roleTitle: string;
  seniority: string;
  domain: string;
  anchor: string;
  fitSummary: string;
  isHiddenGem: boolean;
}) => {
  const opener = params.isHiddenGem
    ? `REQUIRED opening line (use verbatim as the first sentence): "I almost missed your profile — your title didn't match, but your work did."\n`
    : "";
  return `Write a 5-7 sentence LinkedIn outreach message from a recruiter at ${params.company} to ${params.firstName}.
${opener}
Role: ${params.roleTitle} (${params.seniority} level, ${params.domain} domain).
Specific anchor to reference (paraphrase, don't quote verbatim): "${params.anchor}".
Why they fit (inspiration only, do NOT copy text): "${params.fitSummary}".

Requirements:
- Address by first name: ${params.firstName}
- Reference ONE specific project or achievement from their background
- Explain why they specifically fit this role
- Soft CTA like "Would love to chat for 15 minutes…"
- Warm, human tone — NOT a template blast
- Output the message body ONLY (no subject line, no preamble, no signature).`;
};

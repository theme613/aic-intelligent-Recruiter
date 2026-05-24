import { GoogleGenerativeAI } from "@google/generative-ai";

export type CandidateAnalysis = {
  name: string;
  score: number;
  skillScore: number;
  experienceScore: number;
  domainScore: number;
  seniorityScore: number;
  outreachScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  keyStrengths: string[];
  whyThisPerson: string;
  skillsGap: string;
  interviewFocus: string;
  outreachMessage: string;
  summary: string;
};

const GEMINI_MODEL = "gemini-2.0-flash";

const SYSTEM_INSTRUCTION = `You are a senior technical recruiter with 10+ years experience at top tech companies.
Analyze the candidate resume against the job description with deep semantic reasoning.
Understand that 'built ML pipelines' = machine learning experience, 'scaled microservices' = backend engineering.
Look for evidence of impact (metrics, scale, outcomes), not just keyword presence.
Return ONLY valid JSON.`;

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      maxOutputTokens: 1500,
      responseMimeType: "application/json",
    },
  });
}

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function computeOverallScore(analysis: {
  skillScore: number;
  experienceScore: number;
  domainScore: number;
  seniorityScore: number;
  outreachScore: number;
}): number {
  return Math.round(
    analysis.skillScore * 0.3 +
      analysis.experienceScore * 0.25 +
      analysis.domainScore * 0.15 +
      analysis.seniorityScore * 0.15 +
      analysis.outreachScore * 0.15,
  );
}

export function normalizeAnalysis(
  raw: CandidateAnalysis,
  fallbackName?: string,
): CandidateAnalysis {
  const score = computeOverallScore(raw);
  return {
    ...raw,
    name: raw.name || fallbackName || "Unknown Candidate",
    score,
    keyStrengths: raw.keyStrengths?.slice(0, 3) ?? [],
  };
}

export function parseAnalysisJson(raw: string): CandidateAnalysis {
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean) as CandidateAnalysis;
}

export async function analyzeCandidate({
  jobTitle,
  company,
  requiredSkills,
  experienceLevel,
  jobDescription,
  resumeText,
  candidateName,
}: {
  jobTitle: string;
  company: string;
  requiredSkills: string[];
  experienceLevel: string;
  jobDescription: string;
  resumeText: string;
  candidateName?: string;
}): Promise<CandidateAnalysis> {
  const model = getGeminiModel();

  const prompt = `Job Title: ${jobTitle}
Company: ${company}
Required Skills: ${requiredSkills.join(", ")}
Experience Level: ${experienceLevel}
Job Description: ${jobDescription}

Candidate Resume:
${resumeText}

Instructions:
- Score each dimension separately from 0-100: skillScore, experienceScore, domainScore, seniorityScore, outreachScore
- Set score to the weighted overall: (skillScore*0.30 + experienceScore*0.25 + domainScore*0.15 + seniorityScore*0.15 + outreachScore*0.15), rounded to integer
- Extract exactly 3 keyStrengths as evidence snippets quoted or paraphrased from the resume
- Write interviewFocus as one actionable probe question for the hiring manager
- Write outreachMessage as a personalized LinkedIn/email message from the recruiter at ${company}

Return this exact JSON structure:
{
  "name": "extracted candidate full name or Unknown Candidate",
  "score": number,
  "skillScore": number,
  "experienceScore": number,
  "domainScore": number,
  "seniorityScore": number,
  "outreachScore": number,
  "matchedSkills": ["skills from required list evidenced in resume"],
  "missingSkills": ["required skills NOT evidenced in resume"],
  "keyStrengths": ["evidence point 1", "evidence point 2", "evidence point 3"],
  "whyThisPerson": "2-3 sentence personalized pitch",
  "skillsGap": "1 sentence on what to improve",
  "interviewFocus": "one actionable interview probe question",
  "outreachMessage": "personalized recruiter outreach message",
  "summary": "one line candidate profile summary"
}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  const parsed = parseAnalysisJson(raw);
  return normalizeAnalysis(parsed, candidateName);
}

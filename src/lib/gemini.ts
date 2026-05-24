import { GoogleGenerativeAI } from "@google/generative-ai";

export type CandidateAnalysis = {
  name: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  whyThisPerson: string;
  skillsGap: string;
  outreachMessage: string;
  summary: string;
};

const GEMINI_MODEL = "gemini-2.0-flash";

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction:
      "You are an expert technical recruiter with 10 years of experience. Analyze the candidate resume against the job description and return ONLY a valid JSON object with no markdown, no explanation, just raw JSON.",
    generationConfig: {
      maxOutputTokens: 1000,
      responseMimeType: "application/json",
    },
  });
}

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
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
}: {
  jobTitle: string;
  company: string;
  requiredSkills: string[];
  experienceLevel: string;
  jobDescription: string;
  resumeText: string;
}): Promise<CandidateAnalysis> {
  const model = getGeminiModel();

  const prompt = `Job Title: ${jobTitle}
Company: ${company}
Required Skills: ${requiredSkills.join(", ")}
Experience Level: ${experienceLevel}
Job Description: ${jobDescription}

Candidate Resume:
${resumeText}

Return this exact JSON structure:
{
  "name": "extracted candidate full name or Unknown Candidate",
  "score": number between 0-100 representing match percentage,
  "matchedSkills": ["array of skills from required list found in resume"],
  "missingSkills": ["array of required skills NOT found in resume"],
  "whyThisPerson": "2-3 sentence personalized pitch for why this candidate fits this role",
  "skillsGap": "1 sentence describing what the candidate needs to improve",
  "outreachMessage": "personalized LinkedIn/email outreach message from recruiter to candidate",
  "summary": "one line summary of the candidate profile"
}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  return parseAnalysisJson(raw);
}

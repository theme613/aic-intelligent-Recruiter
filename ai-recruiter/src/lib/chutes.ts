import OpenAI from "openai";

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

function getChutesClient(): OpenAI {
  const apiKey = process.env.CHUTES_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("CHUTES_API_KEY is not configured");
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://llm.chutes.ai/v1",
  });
}

export function hasChutesApiKey(): boolean {
  return Boolean(process.env.CHUTES_API_KEY?.trim());
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
  const chutes = getChutesClient();
  const response = await chutes.chat.completions.create({
    model: "deepseek-ai/DeepSeek-V3-0324",
    max_tokens: 1000,
    messages: [
      {
        role: "system",
        content:
          "You are an expert technical recruiter with 10 years of experience. Analyze the candidate resume against the job description and return ONLY a valid JSON object with no markdown, no explanation, just raw JSON.",
      },
      {
        role: "user",
        content: `Job Title: ${jobTitle}
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
}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  return parseAnalysisJson(raw);
}

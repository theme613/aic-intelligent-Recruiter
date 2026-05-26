import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import { withRetry } from "./retry";

/**
 * Per-task Gemini model factory.
 *
 * Each step picks the cheapest model that can hit the quality bar — we do NOT
 * use one model for everything.
 */

type Task =
  | "extract_jd"
  | "extract_candidate"
  | "fact_check"
  | "hidden_gem"
  | "pitch"
  | "outreach";

type TaskConfig = {
  model: string;
  temperature: number;
  maxTokens: number;
  responseMimeType?: "application/json";
  systemInstruction: string;
};

const TASKS: Record<Task, TaskConfig> = {
  extract_jd: {
    model: "gemini-2.5-flash",
    temperature: 0.1,
    maxTokens: 1200,
    responseMimeType: "application/json",
    systemInstruction:
      "You are a structured extraction engine. Return ONLY valid JSON, no markdown, no commentary.",
  },
  extract_candidate: {
    model: "gemini-2.5-flash",
    temperature: 0.1,
    maxTokens: 1500,
    responseMimeType: "application/json",
    systemInstruction:
      "You are a resume parser. Normalize skill synonyms (e.g. 'ML pipelines' = 'machine learning', 'Postgres' = 'sql'). Use lowercase skills. Return ONLY valid JSON.",
  },
  fact_check: {
    model: "gemini-2.5-flash",
    temperature: 0.1,
    maxTokens: 1000,
    responseMimeType: "application/json",
    systemInstruction:
      "You are a resume fraud-detection specialist. Identify internal inconsistencies, impossible date math, inflated claims, and suspicious patterns. Return ONLY valid JSON.",
  },
  hidden_gem: {
    // AGENTIC STEP — Hidden Gem detection, called ONCE per run
    model: "gemini-2.5-flash",
    temperature: 0.3,
    maxTokens: 2500,
    responseMimeType: "application/json",
    systemInstruction:
      "You are a senior recruiter specializing in finding hidden gems — candidates unfairly ranked low due to title mismatch whose work evidence strongly matches the JD. Return ONLY valid JSON.",
  },
  pitch: {
    model: "gemini-2.5-flash",
    temperature: 0.7,
    maxTokens: 1500,
    responseMimeType: "application/json",
    systemInstruction:
      "You are a senior technical recruiter. Write human, specific narratives that cite resume evidence. Return ONLY valid JSON.",
  },
  outreach: {
    model: "gemini-2.5-flash",
    temperature: 0.8,
    maxTokens: 600,
    systemInstruction:
      "You are a warm, specific recruiter. Write personalized outreach that sounds human, not templated. Output only the message body.",
  },
};

let _client: GoogleGenerativeAI | null = null;

function client(): GoogleGenerativeAI {
  if (_client) return _client;
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  _client = new GoogleGenerativeAI(apiKey);
  return _client;
}

// text-embedding-004 is only available on the stable v1 endpoint,
// not the v1beta endpoint the SDK defaults to.
let _embeddingClient: GoogleGenerativeAI | null = null;

function embeddingClient(): GoogleGenerativeAI {
  if (_embeddingClient) return _embeddingClient;
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  // @ts-expect-error — requestOptions is supported in 0.21+ but not yet typed in all versions
  _embeddingClient = new GoogleGenerativeAI(apiKey, { apiVersion: "v1" });
  return _embeddingClient;
}

export function getModel(task: Task): GenerativeModel {
  const cfg = TASKS[task];
  return client().getGenerativeModel({
    model: cfg.model,
    systemInstruction: cfg.systemInstruction,
    generationConfig: {
      temperature: cfg.temperature,
      maxOutputTokens: cfg.maxTokens,
      ...(cfg.responseMimeType
        ? { responseMimeType: cfg.responseMimeType }
        : {}),
    },
  });
}

export function getEmbeddingModel(): GenerativeModel {
  return embeddingClient().getGenerativeModel({ model: "text-embedding-004" });
}

/**
 * Drop-in replacement for model.generateContent() with automatic 429 retry.
 * All pipeline steps should use this instead of calling model.generateContent directly.
 */
export async function generateWithRetry(
  model: GenerativeModel,
  prompt: Parameters<GenerativeModel["generateContent"]>[0],
  label = "llm",
) {
  return withRetry(() => model.generateContent(prompt), label);
}

/** Strip optional ```json fences then JSON.parse. */
export function parseJson<T>(raw: string): T {
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean) as T;
}

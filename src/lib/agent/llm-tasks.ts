/**
 * Shared task config + Gemini-specific model factory.
 *
 * Split out from llm.ts so `providers.ts` can consume the task table without
 * pulling in the higher-level `generateText` entry point (which itself
 * imports from `providers.ts` — would otherwise be a cycle).
 */

import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

export type Task =
  | "extract_jd"
  | "extract_candidate"
  | "fact_check"
  | "hidden_gem"
  | "pitch"
  | "outreach";

export type TaskConfig = {
  /** Gemini model name. Each provider in providers.ts maps Task → its own model. */
  model: string;
  temperature: number;
  maxTokens: number;
  responseMimeType?: "application/json";
  systemInstruction: string;
  /**
   * Gemini-only: tokens spent on hidden reasoning before output. 0 disables
   * thinking for deterministic JSON extraction; small positive values help
   * creative tasks. Ignored by non-Gemini providers.
   */
  thinkingBudget?: number;
};

/**
 * Per-task model assignment for Gemini.
 *
 * Free-tier Gemini quotas are PER-MODEL, so we deliberately spread tasks
 * across model families to multiply the available daily headroom:
 *
 *   gemini-2.5-flash-lite  → cheap deterministic extraction + outreach
 *   gemini-2.0-flash       → fact-check (separate family quota)
 *   gemini-2.5-flash       → reserved for higher-quality reasoning
 *                            (hidden-gem reflection, pitch narratives)
 *
 * When any of these models is rate-limited, `providers.ts` falls through to
 * Groq → Mistral → OpenRouter automatically.
 */
export const TASKS: Record<Task, TaskConfig> = {
  extract_jd: {
    model: "gemini-2.5-flash-lite",
    temperature: 0.1,
    maxTokens: 2048,
    responseMimeType: "application/json",
    thinkingBudget: 0,
    systemInstruction:
      "You are a structured extraction engine. Return ONLY valid JSON, no markdown, no commentary.",
  },
  extract_candidate: {
    model: "gemini-2.5-flash-lite",
    temperature: 0.1,
    maxTokens: 2500,
    responseMimeType: "application/json",
    thinkingBudget: 0,
    systemInstruction:
      "You are a resume parser. Normalize skill synonyms (e.g. 'ML pipelines' = 'machine learning', 'Postgres' = 'sql'). Use lowercase skills. Return ONLY valid JSON.",
  },
  fact_check: {
    model: "gemini-2.0-flash",
    temperature: 0.1,
    maxTokens: 1500,
    responseMimeType: "application/json",
    systemInstruction:
      "You are a resume fraud-detection specialist. Identify internal inconsistencies, impossible date math, inflated claims, and suspicious patterns. Return ONLY valid JSON.",
  },
  hidden_gem: {
    model: "gemini-2.5-flash",
    temperature: 0.3,
    maxTokens: 4000,
    responseMimeType: "application/json",
    thinkingBudget: 1024,
    systemInstruction:
      "You are a senior recruiter specializing in finding hidden gems — candidates unfairly ranked low due to title mismatch whose work evidence strongly matches the JD. Return ONLY valid JSON.",
  },
  pitch: {
    model: "gemini-2.5-flash",
    temperature: 0.7,
    maxTokens: 2500,
    responseMimeType: "application/json",
    thinkingBudget: 512,
    systemInstruction:
      "You are a senior technical recruiter. Write human, specific narratives that cite resume evidence. Return ONLY valid JSON.",
  },
  outreach: {
    model: "gemini-2.5-flash-lite",
    temperature: 0.8,
    maxTokens: 1000,
    thinkingBudget: 0,
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

/** Build a configured Gemini GenerativeModel for the given task. */
export function getGeminiModel(task: Task): GenerativeModel {
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
      // thinkingConfig is supported by gemini-2.5-flash* but not yet typed
      // in @google/generative-ai v0.24. Cast through unknown to pass it.
      ...(cfg.thinkingBudget !== undefined
        ? ({ thinkingConfig: { thinkingBudget: cfg.thinkingBudget } } as Record<
            string,
            unknown
          >)
        : {}),
    },
  });
}

/**
 * `gemini-embedding-001` is the current recommended embedding model and is
 * served on the v1beta endpoint that the SDK uses by default. The previously
 * used `text-embedding-004` is deprecated and returns 404 on v1beta.
 */
export function getEmbeddingModel(): GenerativeModel {
  return client().getGenerativeModel({ model: "gemini-embedding-001" });
}

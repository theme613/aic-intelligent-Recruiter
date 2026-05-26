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
  /**
   * gemini-2.5-flash is a thinking model — it spends tokens on internal
   * reasoning before producing output. For deterministic extraction tasks
   * (parse JD, parse resume, etc.) we want thinking OFF to save tokens
   * and prevent JSON truncation. For creative tasks (pitch, hidden gem)
   * we keep a small thinking budget.
   */
  thinkingBudget?: number;
};

const TASKS: Record<Task, TaskConfig> = {
  extract_jd: {
    model: "gemini-2.5-flash",
    temperature: 0.1,
    maxTokens: 2048,
    responseMimeType: "application/json",
    thinkingBudget: 0,
    systemInstruction:
      "You are a structured extraction engine. Return ONLY valid JSON, no markdown, no commentary.",
  },
  extract_candidate: {
    model: "gemini-2.5-flash",
    temperature: 0.1,
    maxTokens: 2500,
    responseMimeType: "application/json",
    thinkingBudget: 0,
    systemInstruction:
      "You are a resume parser. Normalize skill synonyms (e.g. 'ML pipelines' = 'machine learning', 'Postgres' = 'sql'). Use lowercase skills. Return ONLY valid JSON.",
  },
  fact_check: {
    model: "gemini-2.5-flash",
    temperature: 0.1,
    maxTokens: 1500,
    responseMimeType: "application/json",
    thinkingBudget: 0,
    systemInstruction:
      "You are a resume fraud-detection specialist. Identify internal inconsistencies, impossible date math, inflated claims, and suspicious patterns. Return ONLY valid JSON.",
  },
  hidden_gem: {
    // AGENTIC STEP — Hidden Gem detection, called ONCE per run
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
    model: "gemini-2.5-flash",
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
      // thinkingConfig is supported by gemini-2.5-flash but not yet typed
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

/**
 * Strip optional ```json fences then JSON.parse.
 * If the JSON is truncated (e.g. model hit maxOutputTokens mid-output),
 * attempts to repair by closing unbalanced strings/brackets so the caller
 * gets a partial-but-usable object instead of a hard throw.
 */
export function parseJson<T>(raw: string): T {
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean) as T;
  } catch (firstErr) {
    const repaired = repairTruncatedJson(clean);
    try {
      return JSON.parse(repaired) as T;
    } catch {
      throw firstErr;
    }
  }
}

/**
 * Best-effort repair of JSON that was cut off mid-output.
 * - Closes an unterminated string
 * - Drops a trailing comma
 * - Closes any unclosed { [ pairs
 */
function repairTruncatedJson(s: string): string {
  let out = s;
  // Detect unterminated string by counting unescaped quotes
  let inString = false;
  let escape = false;
  const stack: string[] = [];
  for (const ch of out) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  if (inString) out += '"';
  out = out.replace(/,\s*$/, "");
  while (stack.length > 0) out += stack.pop();
  return out;
}

/**
 * Public LLM façade used by the pipeline steps.
 *
 * Most step files should call `generateText(task, prompt, label)` — it
 * routes through the provider chain in `providers.ts` (Gemini → Groq →
 * Mistral → OpenRouter) with automatic failover on 429/503.
 *
 * `generateWithRetry` and `getModel` are kept for callers that need to
 * speak directly to Gemini (e.g. embeddings). New code should prefer
 * `generateText`.
 */

import type { GenerativeModel } from "@google/generative-ai";
import {
  TASKS,
  getEmbeddingModel as _getEmbeddingModel,
  getGeminiModel,
  type Task,
} from "./llm-tasks";
import { generateViaChain } from "./providers";
import { withRetry } from "./retry";

export type { Task };
export { TASKS };
export const getEmbeddingModel = _getEmbeddingModel;

/** Back-compat: returns a Gemini GenerativeModel for the given task. */
export function getModel(task: Task): GenerativeModel {
  return getGeminiModel(task);
}

/**
 * Generate text for `task` using the configured provider chain. Falls back
 * automatically across Gemini → Groq → Mistral → OpenRouter when a provider
 * is rate-limited, unauthorized, or down.
 */
export async function generateText(
  task: Task,
  prompt: string,
  label: string,
): Promise<string> {
  const cfg = TASKS[task];
  return generateViaChain(
    task,
    {
      systemInstruction: cfg.systemInstruction,
      prompt,
      temperature: cfg.temperature,
      maxTokens: cfg.maxTokens,
      json: cfg.responseMimeType === "application/json",
      thinkingBudget: cfg.thinkingBudget,
    },
    label,
  );
}

/**
 * Drop-in replacement for `model.generateContent()` with automatic 429 retry.
 *
 * NOTE: This bypasses the multi-provider chain — only the Gemini API is
 * called. Prefer `generateText(task, prompt, label)` for failover behaviour.
 */
export async function generateWithRetry(
  model: GenerativeModel,
  prompt: Parameters<GenerativeModel["generateContent"]>[0],
  label = "llm",
) {
  return withRetry(
    () => model.generateContent(prompt),
    label,
    `gemini:${(model as unknown as { model: string }).model}`,
  );
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

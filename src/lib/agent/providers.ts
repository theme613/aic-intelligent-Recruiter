/**
 * Multi-provider LLM dispatch with automatic failover.
 *
 * Provider chain (tried in order):
 *   1. Gemini       — preferred, has dedicated thinking models + JSON mode
 *   2. Groq         — very fast inference, generous free RPM
 *   3. Mistral AI   — solid quality, separate quota bucket
 *   4. OpenRouter   — catch-all aggregator with free models
 *
 * For every call we try providers top-to-bottom. A provider is skipped if:
 *   - its API key isn't configured, or
 *   - its circuit breaker is tripped (recent 429 / daily quota exhausted).
 *
 * On 429/503 we trip the provider for a short TTL and fall through to the
 * next one immediately — no waiting, no log spam. The chain itself is the
 * resilience strategy; per-provider retries would just delay failover.
 */

import type { GenerateContentResult } from "@google/generative-ai";
import { getGeminiModel, TASKS, type Task } from "./llm-tasks";
import {
  MINUTE_TRIP_TTL_MS,
  isModelTripped,
  tripModel,
  withRetry,
} from "./retry";

export type LLMRequest = {
  systemInstruction: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  json: boolean;
  /**
   * Gemini-only: token budget for the hidden reasoning step. Ignored by
   * OpenAI-compatible providers.
   */
  thinkingBudget?: number;
};

type LLMProvider = {
  name: string;
  available: () => boolean;
  modelFor: (task: Task) => string;
  /**
   * Generate plain text. Implementations should throw on non-2xx with an
   * Error whose `status` matches the HTTP status code so the chain can
   * trip the provider on 429/503.
   */
  generate: (task: Task, req: LLMRequest, label: string) => Promise<string>;
};

// ── Gemini ────────────────────────────────────────────────────────────────

const geminiProvider: LLMProvider = {
  name: "gemini",
  available: () => Boolean(process.env.GEMINI_API_KEY?.trim()),
  modelFor: (task) => TASKS[task].model,
  generate: async (task, req, label) => {
    const model = getGeminiModel(task);
    const result: GenerateContentResult = await withRetry(
      () => model.generateContent(req.prompt),
      `gemini:${label}`,
      `gemini:${TASKS[task].model}`,
    );
    return result.response.text();
  },
};

// ── OpenAI-compatible providers (Groq / Mistral / OpenRouter) ────────────

type OpenAICompatibleConfig = {
  name: string;
  baseUrl: string;
  envVar: string;
  modelForTask: (task: Task) => string;
  /** Extra headers required by the provider (e.g. OpenRouter analytics). */
  extraHeaders?: Record<string, string>;
};

async function callOpenAICompatible(
  config: OpenAICompatibleConfig,
  req: LLMRequest,
  label: string,
  model: string,
): Promise<string> {
  const apiKey = process.env[config.envVar]?.trim();
  if (!apiKey) {
    const e = new Error(`${config.name}: ${config.envVar} not set`);
    (e as { status?: number }).status = 401;
    throw e;
  }

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: req.systemInstruction },
      { role: "user", content: req.prompt },
    ],
    temperature: req.temperature,
    max_tokens: req.maxTokens,
  };
  if (req.json) {
    body.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(config.extraHeaders ?? {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(
      `${config.name} ${res.status} (${label}): ${text.slice(0, 300)}`,
    ) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error(`${config.name} returned empty content for ${label}`);
  }
  return text;
}

function openAICompatibleProvider(config: OpenAICompatibleConfig): LLMProvider {
  return {
    name: config.name,
    available: () => Boolean(process.env[config.envVar]?.trim()),
    modelFor: config.modelForTask,
    generate: (task, req, label) =>
      callOpenAICompatible(config, req, label, config.modelForTask(task)),
  };
}

/**
 * Per-provider task → model mapping. Free-tier-friendly defaults; tasks that
 * need a smaller/faster model override the default below.
 *
 *  - Groq:       llama-3.3-70b-versatile (general), llama-3.1-8b-instant (extract)
 *  - Mistral:    mistral-small-latest (free-tier accessible across all tasks)
 *  - OpenRouter: meta-llama/llama-3.3-70b-instruct:free
 */
const GROQ_MODELS: Partial<Record<Task, string>> = {
  extract_jd: "llama-3.1-8b-instant",
  extract_candidate: "llama-3.1-8b-instant",
};
const GROQ_DEFAULT = "llama-3.3-70b-versatile";

const MISTRAL_DEFAULT = "mistral-small-latest";

const OPENROUTER_DEFAULT = "meta-llama/llama-3.3-70b-instruct:free";

const groqProvider = openAICompatibleProvider({
  name: "groq",
  baseUrl: "https://api.groq.com/openai/v1",
  envVar: "GROQ_API_KEY",
  modelForTask: (task) => GROQ_MODELS[task] ?? GROQ_DEFAULT,
});

const mistralProvider = openAICompatibleProvider({
  name: "mistral",
  baseUrl: "https://api.mistral.ai/v1",
  envVar: "MISTRAL_API_KEY",
  modelForTask: () => MISTRAL_DEFAULT,
});

const openRouterProvider = openAICompatibleProvider({
  name: "openrouter",
  baseUrl: "https://openrouter.ai/api/v1",
  envVar: "OPENROUTER_API_KEY",
  modelForTask: () => OPENROUTER_DEFAULT,
  extraHeaders: {
    // OpenRouter recommends these for analytics + rate-limit prioritisation.
    "HTTP-Referer":
      process.env.OPENROUTER_REFERER ?? "https://aic-intelligent-recruiter",
    "X-Title": process.env.OPENROUTER_TITLE ?? "AI Intelligent Recruiter",
  },
});

// ── Chain dispatch ────────────────────────────────────────────────────────

const PROVIDER_CHAIN: LLMProvider[] = [
  geminiProvider,
  groqProvider,
  mistralProvider,
  openRouterProvider,
];

/** Names of providers with an API key configured, in chain order. */
export function activeProviderNames(): string[] {
  return PROVIDER_CHAIN.filter((p) => p.available()).map((p) => p.name);
}

/**
 * Generate text via the provider chain. Tries each available provider in
 * order; trips the provider's circuit breaker on 429/503 and falls through
 * to the next. Throws only if every provider fails.
 */
export async function generateViaChain(
  task: Task,
  req: LLMRequest,
  label: string,
): Promise<string> {
  const errors: string[] = [];
  let attempted = 0;

  for (const provider of PROVIDER_CHAIN) {
    if (!provider.available()) continue;
    const model = provider.modelFor(task);
    const key = `${provider.name}:${model}`;
    if (isModelTripped(key)) continue;

    attempted++;
    try {
      return await provider.generate(task, req, label);
    } catch (err) {
      const status = (err as { status?: number } | null)?.status;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${provider.name}(${status ?? "?"}): ${msg.slice(0, 120)}`);

      // 429/503 = trip and fall through to next provider.
      // Gemini's withRetry already trips on per-day quota (1h); the short
      // trip below covers transient per-minute limits on any provider.
      if (status === 429 || status === 503) {
        tripModel(
          key,
          `${label} returned ${status}`,
          MINUTE_TRIP_TTL_MS,
        );
        continue;
      }
      // 5xx other than 503 — likely transient — try next provider too.
      if (typeof status === "number" && status >= 500) {
        continue;
      }
      // Auth / invalid key (401, 403): skip this provider for the run.
      if (status === 401 || status === 403) {
        tripModel(
          key,
          `${label} auth failure (${status})`,
          60 * 60 * 1000, // 1 hour
        );
        continue;
      }
      // Other errors (400, parse errors, etc.): still try next provider —
      // a malformed request from one provider may succeed on another.
      continue;
    }
  }

  if (attempted === 0) {
    throw new Error(
      `[providers] No LLM provider is available for ${label}. ` +
        `Configure at least one of: GEMINI_API_KEY, GROQ_API_KEY, MISTRAL_API_KEY, OPENROUTER_API_KEY.`,
    );
  }
  throw new Error(
    `[providers] All providers failed for ${label}: ${errors.join(" | ")}`,
  );
}

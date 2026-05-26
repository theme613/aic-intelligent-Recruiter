/**
 * Retry + concurrency utilities for Gemini API calls.
 *
 * Gemini free tier limits: 15 RPM, 1M TPD per model.
 * When 429 fires, the API response includes a `retryDelay` (e.g. "4.3s").
 * We honour that delay + 500 ms buffer, then retry up to MAX_RETRIES times.
 *
 * mapConcurrent replaces Promise.all for parallel LLM work: it keeps at most
 * GEMINI_CONCURRENCY requests in-flight at once, preventing burst 429s.
 */

const MAX_RETRIES = 4;
// gemini-2.5-flash free tier = 5 RPM. Sequential calls (concurrency=1) avoid
// bursting through the limit. Override via GEMINI_CONCURRENCY env var.
const DEFAULT_CONCURRENCY = 1;
// Maximum time we're willing to sleep on a single retry. On Vercel Hobby
// the function dies at 60s, so longer waits = guaranteed timeout. Better
// to give up and let the caller use its fallback path.
const MAX_RETRY_DELAY_MS = 12000;

// ── Daily-quota circuit breaker ──────────────────────────────────────────
//
// Free-tier Gemini enforces a per-model daily request cap. Once tripped, the
// API will return 429 with a retryDelay of "minutes to hours" until the
// daily window resets. Hammering retries against it just spams logs and
// wastes wall time — every subsequent call in the same run will fail too.
//
// To degrade cleanly: when we detect a daily-quota 429 for a given model,
// we mark that model "tripped" and short-circuit ALL future calls for the
// same model in this process for `TRIP_TTL_MS`. Callers' fallback paths
// (template pitches, skill-overlap scoring, etc.) take over without delay.

const TRIPPED_MODELS = new Map<string, number>(); // key → unix ms expiry
/** Default trip duration for daily-quota failures (Gemini per-day caps). */
const DAILY_TRIP_TTL_MS = 60 * 60 * 1000; // 1 hour
/** Short trip duration for per-minute 429s on alternative providers. */
export const MINUTE_TRIP_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Check whether a provider:model key is currently tripped.
 * Keys are arbitrary strings — callers may prefix with provider name to avoid
 * collisions (e.g. "gemini:gemini-2.5-flash", "groq:llama-3.3-70b-versatile").
 */
export function isModelTripped(key: string | undefined): boolean {
  if (!key) return false;
  const expiry = TRIPPED_MODELS.get(key);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    TRIPPED_MODELS.delete(key);
    return false;
  }
  return true;
}

/**
 * Mark a provider:model key tripped. Subsequent `isModelTripped(key)` calls
 * return true until the TTL expires. If the key is already tripped, the
 * expiry is extended only if the new TTL would push it later (we never
 * shorten an existing trip).
 */
export function tripModel(
  key: string,
  reason: string,
  ttlMs: number = DAILY_TRIP_TTL_MS,
): void {
  const newExpiry = Date.now() + ttlMs;
  const existing = TRIPPED_MODELS.get(key) ?? 0;
  TRIPPED_MODELS.set(key, Math.max(existing, newExpiry));
  const seconds = Math.round(ttlMs / 1000);
  console.warn(
    `[retry] circuit breaker — ${key} marked exhausted for ~${seconds}s (${reason}).`,
  );
}

/** Reset the circuit breaker. Mostly for tests. */
export function resetQuotaCircuitBreaker(): void {
  TRIPPED_MODELS.clear();
}

function isRetryableError(err: unknown): boolean {
  if (typeof err !== "object" || !err) return false;
  const status = (err as { status?: number }).status;
  // 429 = rate limit (retry after delay), 503 = temporary overload (retry after backoff)
  return status === 429 || status === 503;
}

function isRateLimitError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { status?: number }).status === 429;
}

/** True iff the 429 errorDetails identify a per-DAY quota (vs per-minute). */
function isDailyQuotaError(err: unknown): boolean {
  if (typeof err !== "object" || !err) return false;
  const details = (err as { errorDetails?: unknown }).errorDetails;
  if (!Array.isArray(details)) return false;
  for (const d of details) {
    const violations = (d as { violations?: unknown }).violations;
    if (!Array.isArray(violations)) continue;
    for (const v of violations) {
      const id = (v as { quotaId?: unknown }).quotaId;
      if (typeof id === "string" && /PerDay/i.test(id)) return true;
    }
  }
  return false;
}

function parseRetryDelayMs(err: unknown): number {
  if (typeof err !== "object" || !err) return 6000;
  const details = (err as Record<string, unknown>).errorDetails;
  if (!Array.isArray(details)) return 6000;
  const retryInfo = details.find(
    (d: Record<string, unknown>) =>
      typeof d["@type"] === "string" && d["@type"].includes("RetryInfo"),
  );
  if (!retryInfo) return 6000;
  const raw = (retryInfo as Record<string, unknown>).retryDelay;
  if (typeof raw !== "string") return 6000;
  const seconds = parseFloat(raw.replace("s", ""));
  return isNaN(seconds) ? 6000 : Math.ceil(seconds * 1000) + 500;
}

/**
 * Retry an async function on 429/503, honouring the API-suggested retry delay.
 *
 * When `modelName` is supplied:
 *  - if that model was previously marked daily-quota-tripped, we throw
 *    immediately (no waiting, no log spam).
 *  - if the call returns a daily-quota 429, we mark the model tripped.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label = "llm",
  modelName?: string,
  maxRetries = MAX_RETRIES,
): Promise<T> {
  if (isModelTripped(modelName)) {
    throw new Error(
      `[retry] ${label} — ${modelName} daily quota previously exhausted; using fallback`,
    );
  }
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (isRateLimitError(err) && isDailyQuotaError(err) && modelName) {
        tripModel(modelName, `${label} hit per-day cap`);
        throw err;
      }
      if (!isRetryableError(err) || attempt >= maxRetries) throw err;
      // For 503, use a short exponential backoff; for 429, honour the API's retryDelay
      const suggestedDelay = isRateLimitError(err)
        ? parseRetryDelayMs(err)
        : Math.min(2000 * Math.pow(2, attempt - 1), 30000);
      // Cap retry delay to avoid exceeding Vercel function timeout. If the
      // API wants us to wait longer than the cap, give up and let the
      // caller's fallback path run instead of dying at 60s.
      if (suggestedDelay > MAX_RETRY_DELAY_MS) {
        console.warn(
          `[retry] ${label} — ${(err as { status?: number }).status} wants ${suggestedDelay}ms wait (> ${MAX_RETRY_DELAY_MS}ms cap), giving up to allow fallback`,
        );
        throw err;
      }
      console.warn(
        `[retry] ${label} — ${(err as { status?: number }).status} (attempt ${attempt}/${maxRetries}), waiting ${suggestedDelay}ms`,
      );
      await new Promise((r) => setTimeout(r, suggestedDelay));
    }
  }
}

/**
 * Like Promise.all but limits in-flight concurrency.
 * Default concurrency = GEMINI_CONCURRENCY env var or 2.
 */
export async function mapConcurrent<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number = parseInt(
    process.env.GEMINI_CONCURRENCY ?? String(DEFAULT_CONCURRENCY),
    10,
  ),
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const idx = next++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  }

  const pool = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: pool }, worker));
  return results;
}

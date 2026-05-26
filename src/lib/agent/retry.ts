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

function isRetryableError(err: unknown): boolean {
  if (typeof err !== "object" || !err) return false;
  const status = (err as { status?: number }).status;
  // 429 = rate limit (retry after delay), 503 = temporary overload (retry after backoff)
  return status === 429 || status === 503;
}

function isRateLimitError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { status?: number }).status === 429;
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

/** Retry an async function on 429, honouring the API-suggested retry delay. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label = "llm",
  maxRetries = MAX_RETRIES,
): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
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

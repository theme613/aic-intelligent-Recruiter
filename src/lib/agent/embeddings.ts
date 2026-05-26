import { getEmbeddingModel } from "./llm";
import { withRetry } from "./retry";

export type EmbedTaskType = "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT";

/**
 * Single embedding via Gemini's embedding model, retrying on 429.
 *
 * The circuit-breaker key is passed so that once Gemini's daily embedding
 * quota is exhausted, subsequent calls in the same process throw
 * immediately (no 20+ second wait) and the caller falls back to
 * `skillOverlapScore` cleanly.
 */
export async function embed(
  text: string,
  taskType: EmbedTaskType,
): Promise<number[]> {
  const model = getEmbeddingModel();
  const result = await withRetry(
    () =>
      model.embedContent({
        content: { role: "user", parts: [{ text }] },
        taskType,
      } as Parameters<typeof model.embedContent>[0]),
    "embed",
    "gemini:gemini-embedding-001",
  );
  return result.embedding.values;
}

/**
 * Batch embed — calls embedContent individually in parallel.
 * The batchEmbedContents SDK method can silently fail on some SDK versions;
 * individual Promise.all calls are more reliable and still fast.
 */
export async function embedBatch(
  texts: string[],
  taskType: EmbedTaskType,
): Promise<number[][]> {
  if (texts.length === 0) return [];
  return Promise.all(texts.map((t) => embed(t, taskType)));
}

export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

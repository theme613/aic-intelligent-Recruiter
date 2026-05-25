import { getEmbeddingModel } from "./llm";

export type EmbedTaskType = "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT";

type EmbedContent = {
  content: { role: "user"; parts: [{ text: string }] };
  taskType: EmbedTaskType;
};

function makeRequest(text: string, taskType: EmbedTaskType): EmbedContent {
  return {
    content: { role: "user", parts: [{ text }] },
    taskType,
  };
}

/** Single-document embedding via models/text-embedding-004. */
export async function embed(
  text: string,
  taskType: EmbedTaskType,
): Promise<number[]> {
  const model = getEmbeddingModel();
  // SDK accepts the request object shape with taskType
  const result = await model.embedContent(
    makeRequest(text, taskType) as unknown as Parameters<
      typeof model.embedContent
    >[0],
  );
  return result.embedding.values;
}

/** Batch embed — preferred for cost when embedding many documents at once. */
export async function embedBatch(
  texts: string[],
  taskType: EmbedTaskType,
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const model = getEmbeddingModel();
  const result = await model.batchEmbedContents({
    requests: texts.map(
      (t) => makeRequest(t, taskType),
    ) as unknown as Parameters<typeof model.batchEmbedContents>[0]["requests"],
  });
  return result.embeddings.map((e) => e.values);
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

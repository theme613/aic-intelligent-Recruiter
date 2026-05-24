/**
 * Local bag-of-words cosine similarity for semantic-style ranking without embeddings.
 */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  return tf;
}

function vectorFromTf(
  tf: Map<string, number>,
  vocabulary: string[],
): number[] {
  return vocabulary.map((term) => tf.get(term) ?? 0);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Returns similarity score 0–1 between job text and resume text. */
export function cosineSimilarityScore(
  jobText: string,
  resumeText: string,
): number {
  const jobTokens = tokenize(jobText);
  const resumeTokens = tokenize(resumeText);
  const vocab = [...new Set([...jobTokens, ...resumeTokens])];
  const jobVec = vectorFromTf(termFrequency(jobTokens), vocab);
  const resumeVec = vectorFromTf(termFrequency(resumeTokens), vocab);
  return cosineSimilarity(jobVec, resumeVec);
}

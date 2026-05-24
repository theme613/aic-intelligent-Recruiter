/**
 * Semantic keyword expansion + bag-of-words cosine similarity (0–1).
 */

const SKILL_SYNONYMS: Record<string, string[]> = {
  "machine learning": [
    "ml",
    "neural nets",
    "deep learning",
    "tensorflow",
    "pytorch",
    "sklearn",
  ],
  backend: [
    "node.js",
    "express",
    "fastapi",
    "django",
    "microservices",
    "rest api",
  ],
  frontend: ["react", "vue", "next.js", "typescript", "tailwind"],
  devops: [
    "docker",
    "kubernetes",
    "ci/cd",
    "github actions",
    "terraform",
  ],
  data: ["sql", "pandas", "spark", "etl", "data pipeline", "analytics"],
};

function expandWithSynonyms(text: string): string {
  const lower = text.toLowerCase();
  const additions: string[] = [];

  for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    const terms = [canonical, ...synonyms];
    const matched = terms.some((term) => lower.includes(term));
    if (matched) {
      additions.push(canonical, ...synonyms);
    }
  }

  return additions.length ? `${text} ${additions.join(" ")}` : text;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-/]/g, " ")
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

/** Returns normalized semantic similarity score 0–1 between job text and resume text. */
export function cosineSimilarityScore(
  jobText: string,
  resumeText: string,
): number {
  const expandedJob = expandWithSynonyms(jobText);
  const expandedResume = expandWithSynonyms(resumeText);

  const jobTokens = tokenize(expandedJob);
  const resumeTokens = tokenize(expandedResume);
  const vocab = [...new Set([...jobTokens, ...resumeTokens])];
  const jobVec = vectorFromTf(termFrequency(jobTokens), vocab);
  const resumeVec = vectorFromTf(termFrequency(resumeTokens), vocab);

  const raw = cosineSimilarity(jobVec, resumeVec);
  return Math.min(1, Math.max(0, raw));
}

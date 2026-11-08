export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// existing: [{ id, embedding }]. Returns the best match above the threshold, or null.
export function findDuplicate(vector, existing, threshold = 0.85) {
  let best = null;
  for (const item of existing) {
    const score = cosineSimilarity(vector, item.embedding);
    if (score >= threshold && (!best || score > best.score)) {
      best = { id: item.id, score };
    }
  }
  return best;
}

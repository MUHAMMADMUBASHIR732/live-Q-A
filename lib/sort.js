// Pinned first, answered last, otherwise most votes then newest.
const rank = (q) => (q.status === "pinned" ? 0 : q.status === "answered" ? 2 : 1);

export function sortQuestions(list) {
  return [...list].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      b.upvoteCount - a.upvoteCount ||
      new Date(b.createdAt) - new Date(a.createdAt)
  );
}

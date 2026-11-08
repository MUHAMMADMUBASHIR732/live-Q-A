// The only way a question leaves the server. Never include authorToken.
export function publicQuestion(q) {
  return {
    id: q.id,
    sessionId: q.sessionId,
    text: q.text,
    upvoteCount: q.upvoteCount,
    status: q.status,
    clusterLabel: q.cluster ? q.cluster.label : null,
    createdAt: q.createdAt.toISOString(),
  };
}

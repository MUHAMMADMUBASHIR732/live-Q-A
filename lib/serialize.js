// The only way a question leaves the server. Never include authorToken.
export function publicQuestion(q) {
  return {
    id: q.id,
    sessionId: q.sessionId,
    text: q.text,
    authorName: q.authorName || null,
    upvoteCount: q.upvoteCount,
    status: q.status,
    clusterLabel: q.cluster ? q.cluster.label : null,
    createdAt: q.createdAt.toISOString(),
  };
}

// A private reply. Only ever sent to the person who asked, or to the presenter.
// File contents are never included here, only their details.
export function publicReply(r) {
  return {
    id: r.id,
    questionId: r.questionId,
    text: r.text,
    createdAt: r.createdAt.toISOString(),
    files: (r.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      mimeType: f.mimeType,
    })),
  };
}

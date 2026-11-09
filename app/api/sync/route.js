import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicQuestion, publicReply } from "@/lib/serialize";

export const dynamic = "force-dynamic";

// One request returns everything a screen needs: the session, its questions,
// and (for an asker) their own private replies. All queries run at the same time,
// so the whole thing costs about one database round trip once the session id is known.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { sessionId, code, voterToken } = body;

  let id = typeof sessionId === "string" && sessionId ? sessionId : null;
  let session = null;

  if (!id) {
    if (typeof code !== "string" || !code) {
      return NextResponse.json({ error: "Missing session" }, { status: 400 });
    }
    session = await db.session.findUnique({
      where: { joinCode: code.toUpperCase() },
      select: { id: true, title: true, joinCode: true, status: true },
    });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    id = session.id;
  }

  const wantReplies = typeof voterToken === "string" && voterToken.length > 0;

  const [foundSession, questions, clusters, replies] = await Promise.all([
    session
      ? Promise.resolve(session)
      : db.session.findUnique({
          where: { id },
          select: { id: true, title: true, joinCode: true, status: true },
        }),
    db.question.findMany({
      where: { sessionId: id, status: { not: "hidden" } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    db.cluster.findMany({ where: { sessionId: id }, select: { id: true, label: true } }),
    wantReplies
      ? db.reply.findMany({
          where: { question: { sessionId: id, authorToken: voterToken } },
          include: {
            files: { select: { id: true, name: true, size: true, mimeType: true } },
            question: { select: { text: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : Promise.resolve([]),
  ]);

  if (!foundSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Topic labels come from one extra parallel query instead of a join per question.
  const labels = new Map(clusters.map((c) => [c.id, c.label]));
  const list = questions.map((q) =>
    publicQuestion({ ...q, cluster: q.clusterId ? { label: labels.get(q.clusterId) } : null })
  );

  return NextResponse.json(
    {
      session: foundSession,
      questions: list,
      replies: replies.map((r) => ({ ...publicReply(r), questionText: r.question.text })),
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

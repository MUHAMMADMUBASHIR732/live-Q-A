import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { broadcast } from "@/lib/pusher-server";
import { voteLimiter, ipLimiter, getIp } from "@/lib/ratelimit";
import { publicQuestion } from "@/lib/serialize";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { questionId, voterToken } = body;
  if (!questionId || !voterToken) {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  const [byVoter, byIp] = await Promise.all([
    voteLimiter.limit(String(voterToken)),
    ipLimiter.limit(getIp(request)),
  ]);
  if (!byVoter.success || !byIp.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const target = await db.question.findUnique({
    where: { id: questionId },
    include: { session: { select: { status: true } } },
  });
  if (!target || target.status === "hidden") {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }
  if (target.session.status !== "open") {
    return NextResponse.json({ error: "Session closed" }, { status: 403 });
  }

  try {
    // The vote row and the counter change together, or not at all.
    const [, question] = await db.$transaction([
      db.upvote.create({ data: { questionId, voterToken: String(voterToken) } }),
      db.question.update({
        where: { id: questionId },
        data: { upvoteCount: { increment: 1 } },
        include: { cluster: true }, // keep the topic label in the broadcast
      }),
    ]);

    const payload = publicQuestion(question);
    await broadcast(question.sessionId, "question:updated", payload);
    return NextResponse.json({ ok: true, question: payload });
  } catch (error) {
    // The unique constraint fired: this browser already voted.
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
    }
    throw error;
  }
}

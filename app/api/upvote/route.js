import { NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { broadcast } from "@/lib/pusher-server";
import { voteLimiter, ipLimiter, getIp } from "@/lib/ratelimit";

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

  // Both checks run at the same time.
  const [target, session] = await Promise.all([
    db.question.findUnique({
      where: { id: questionId },
      select: { status: true, sessionId: true },
    }),
    db.session.findFirst({
      where: { questions: { some: { id: questionId } } },
      select: { status: true },
    }),
  ]);
  if (!target || !session || target.status === "hidden") {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }
  if (session.status !== "open") {
    return NextResponse.json({ error: "Session closed" }, { status: 403 });
  }

  try {
    // The unique constraint is what stops a second vote from the same browser.
    await db.upvote.create({ data: { questionId, voterToken: String(voterToken) } });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
    }
    throw error;
  }

  const updated = await db.question.update({
    where: { id: questionId },
    data: { upvoteCount: { increment: 1 } },
    select: { upvoteCount: true },
  });

  after(() =>
    broadcast(target.sessionId, "question:patch", { id: questionId, upvoteCount: updated.upvoteCount })
  );
  return NextResponse.json({ ok: true, id: questionId, upvoteCount: updated.upvoteCount });
}

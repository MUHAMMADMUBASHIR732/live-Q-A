import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { replyReadLimiter } from "@/lib/ratelimit";
import { publicReply } from "@/lib/serialize";

export const dynamic = "force-dynamic";

// The person who asked: fetch the private replies to their own questions.
// Matches on the secret voter token, so nobody else gets these.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { sessionId, voterToken } = body;
  if (typeof sessionId !== "string" || typeof voterToken !== "string" || !voterToken) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { success } = await replyReadLimiter.limit(voterToken);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const replies = await db.reply.findMany({
    where: { question: { sessionId, authorToken: voterToken } },
    include: {
      files: { select: { id: true, name: true, size: true, mimeType: true } },
      question: { select: { text: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(
    { replies: replies.map((r) => ({ ...publicReply(r), questionText: r.question.text })) },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

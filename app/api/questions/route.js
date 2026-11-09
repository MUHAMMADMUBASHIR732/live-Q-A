import { NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { broadcast } from "@/lib/pusher-server";
import { questionLimiter, ipLimiter, getIp } from "@/lib/ratelimit";
import { publicQuestion } from "@/lib/serialize";
import { processQuestion } from "@/lib/ai";
import { getCachedSession, cacheSession } from "@/lib/sessionCache";

export const maxDuration = 30; // gives the background AI work time to finish

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { joinCode, text, voterToken } = body;
  const clean = typeof text === "string" ? text.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 40) : "";

  if (!clean || clean.length > 280 || !voterToken || typeof joinCode !== "string") {
    return NextResponse.json({ error: "Invalid question" }, { status: 400 });
  }

  const [byVoter, byIp] = await Promise.all([
    questionLimiter.limit(String(voterToken)),
    ipLimiter.limit(getIp(request)),
  ]);
  if (!byVoter.success || !byIp.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Usually answered from memory, so most questions cost a single database write.
  const code = joinCode.toUpperCase();
  let session = getCachedSession(code);
  if (!session) {
    session = await db.session.findUnique({
      where: { joinCode: code },
      select: { id: true, status: true },
    });
    if (session) cacheSession(code, session);
  }
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.status !== "open") {
    return NextResponse.json({ error: "Session closed" }, { status: 403 });
  }

  const question = await db.question.create({
    data: {
      sessionId: session.id,
      text: clean,
      authorName: name || null,
      authorToken: String(voterToken),
    },
  });

  const payload = publicQuestion(question);

  // Answer the person right now. Telling everyone else, and the AI work, happen after.
  after(async () => {
    await broadcast(session.id, "question:new", payload);
    await processQuestion(question.id, session.id);
  });

  return NextResponse.json(payload, { status: 201 });
}

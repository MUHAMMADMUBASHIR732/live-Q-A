import { NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { broadcast } from "@/lib/pusher-server";
import { questionLimiter, ipLimiter, getIp } from "@/lib/ratelimit";
import { publicQuestion } from "@/lib/serialize";
import { processQuestion } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // gives the background AI work time to finish

// Used by browsers to sync: on connect, after a reconnect, and when polling.
export async function GET(request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { status: true },
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const questions = await db.question.findMany({
    where: { sessionId, status: { not: "hidden" } },
    include: { cluster: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json({
    status: session.status,
    questions: questions.map(publicQuestion),
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { joinCode, text, voterToken } = body;
  const clean = typeof text === "string" ? text.trim() : "";

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

  const session = await db.session.findUnique({
    where: { joinCode: joinCode.toUpperCase() },
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.status !== "open") {
    return NextResponse.json({ error: "Session closed" }, { status: 403 });
  }

  const question = await db.question.create({
    data: { sessionId: session.id, text: clean, authorToken: String(voterToken) },
    include: { cluster: true },
  });

  const payload = publicQuestion(question);
  await broadcast(session.id, "question:new", payload);

  // Runs after the response is sent. Never block the user on AI.
  after(() => processQuestion(question.id, session.id));

  return NextResponse.json(payload, { status: 201 });
}

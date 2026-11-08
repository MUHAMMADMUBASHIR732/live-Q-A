import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { summaryLimiter } from "@/lib/ratelimit";
import { generateSummary } from "@/lib/ai";

export const maxDuration = 30;

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { presenterToken } = body;

  const session = await db.session.findUnique({
    where: { id },
    include: {
      questions: {
        where: { status: { not: "hidden" } },
        include: { cluster: true },
        orderBy: { upvoteCount: "desc" },
        take: 100,
      },
    },
  });
  if (!session || !presenterToken || session.presenterToken !== presenterToken) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (session.questions.length === 0) {
    return NextResponse.json({ summary: "There are no questions to summarise yet." });
  }

  const { success } = await summaryLimiter.limit(id);
  if (!success) {
    return NextResponse.json(
      { error: "Wait 30 seconds before summarising again." },
      { status: 429 }
    );
  }

  try {
    const summary = await generateSummary(session.title, session.questions);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summary failed:", error);
    return NextResponse.json({ error: "The summary could not be created." }, { status: 502 });
  }
}

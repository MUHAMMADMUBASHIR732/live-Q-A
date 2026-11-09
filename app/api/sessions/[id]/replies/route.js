import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicReply } from "@/lib/serialize";

export const dynamic = "force-dynamic";

// Presenter only: the replies they have already sent in this session.
// With a wrong token the filter matches nothing, so nothing is returned.
export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { presenterToken } = body;
  if (typeof presenterToken !== "string" || !presenterToken) {
    return NextResponse.json({ replies: [] });
  }

  const replies = await db.reply.findMany({
    where: { question: { sessionId: id, session: { presenterToken } } },
    include: { files: { select: { id: true, name: true, size: true, mimeType: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json(
    { replies: replies.map(publicReply) },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

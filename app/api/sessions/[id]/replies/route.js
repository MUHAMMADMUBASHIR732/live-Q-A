import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicReply } from "@/lib/serialize";

export const dynamic = "force-dynamic";

// Presenter only: the replies they have already sent in this session.
export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { presenterToken } = body;

  const session = await db.session.findUnique({ where: { id }, select: { presenterToken: true } });
  if (!session || typeof presenterToken !== "string" || session.presenterToken !== presenterToken) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const replies = await db.reply.findMany({
    where: { question: { sessionId: id } },
    include: { files: { select: { id: true, name: true, size: true, mimeType: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json(
    { replies: replies.map(publicReply) },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

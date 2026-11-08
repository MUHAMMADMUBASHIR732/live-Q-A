import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contentDisposition } from "@/lib/files";

export const dynamic = "force-dynamic";

// Download a private file. Allowed for exactly two people: the one who asked the question
// (their voter token) and the presenter of that session (their presenter token).
// Anyone else gets a plain 404, which does not even confirm the file exists.
export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { voterToken, presenterToken } = body;

  const file = await db.replyFile.findUnique({
    where: { id },
    include: {
      reply: {
        include: {
          question: {
            select: {
              authorToken: true,
              session: { select: { presenterToken: true } },
            },
          },
        },
      },
    },
  });

  const q = file?.reply.question;
  const isAsker = typeof voterToken === "string" && voterToken && q?.authorToken === voterToken;
  const isPresenter =
    typeof presenterToken === "string" && presenterToken && q?.session.presenterToken === presenterToken;

  if (!file || (!isAsker && !isPresenter)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // octet-stream plus attachment plus nosniff: the browser saves it and never runs it here.
  return new Response(file.data, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(file.size),
      "Content-Disposition": contentDisposition(file.name),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}

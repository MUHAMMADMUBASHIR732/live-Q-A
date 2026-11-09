import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contentDisposition } from "@/lib/files";

export const dynamic = "force-dynamic";

// Download a private file. Allowed for exactly two people: the one who asked the question
// (their voter token) and the presenter of that session (their presenter token).
// Permission is part of the query itself, so there is one database round trip, and
// anyone else gets a plain 404 that does not confirm the file exists.
export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { voterToken, presenterToken } = body;

  const allowed = [];
  if (typeof voterToken === "string" && voterToken) allowed.push({ authorToken: voterToken });
  if (typeof presenterToken === "string" && presenterToken) {
    allowed.push({ session: { presenterToken } });
  }
  if (allowed.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const file = await db.replyFile.findFirst({
    where: { id, reply: { question: { OR: allowed } } },
  });
  if (!file) {
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

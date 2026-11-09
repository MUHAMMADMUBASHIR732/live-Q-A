import { NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { broadcast } from "@/lib/pusher-server";

const ALLOWED = ["visible", "hidden", "answered", "pinned"];

// Presenter only. The ownership check and the change happen in one database query.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { status, presenterToken, sessionId } = body;

  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (typeof presenterToken !== "string" || !presenterToken || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const result = await db.question.updateMany({
    where: { id, sessionId, session: { presenterToken } },
    data: { status },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  after(() => broadcast(sessionId, "question:patch", { id, status }));
  return NextResponse.json({ id, status });
}

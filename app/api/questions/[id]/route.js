import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { broadcast } from "@/lib/pusher-server";
import { publicQuestion } from "@/lib/serialize";

const ALLOWED = ["visible", "hidden", "answered", "pinned"];

// Presenter only: hide, pin, or mark a question answered.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { status, presenterToken } = body;

  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await db.question.findUnique({
    where: { id },
    include: { session: true },
  });
  if (!existing || !presenterToken || existing.session.presenterToken !== presenterToken) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const updated = await db.question.update({
    where: { id },
    data: { status },
    include: { cluster: true },
  });
  const payload = publicQuestion(updated);
  await broadcast(updated.sessionId, "question:updated", payload);
  return NextResponse.json(payload);
}

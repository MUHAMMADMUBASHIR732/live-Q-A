import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { broadcast } from "@/lib/pusher-server";

// Presenter only: end or reopen a session.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { status, presenterToken } = body;

  if (!["open", "closed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const session = await db.session.findUnique({ where: { id } });
  if (!session || !presenterToken || session.presenterToken !== presenterToken) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await db.session.update({ where: { id }, data: { status } });
  await broadcast(id, "session:status", { status });
  return NextResponse.json({ status });
}

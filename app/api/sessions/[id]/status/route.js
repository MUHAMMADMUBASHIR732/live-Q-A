import { NextResponse, after } from "next/server";
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
  if (typeof presenterToken !== "string" || !presenterToken) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const result = await db.session.updateMany({ where: { id, presenterToken }, data: { status } });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  after(() => broadcast(id, "session:status", { status }));
  return NextResponse.json({ status });
}

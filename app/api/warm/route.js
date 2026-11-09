import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Called quietly when a page opens. A free database sleeps when idle and a server function
// starts cold, so the first real action (like starting a session) would be slow.
// This wakes both up while the visitor is still reading the page.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    // Warming is best effort.
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

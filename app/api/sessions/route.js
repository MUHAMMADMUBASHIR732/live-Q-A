import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { db } from "@/lib/db";

// No 0/O or 1/I so codes are easy to read aloud and type.
const makeCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!title || title.length > 120) {
    return NextResponse.json(
      { error: "Enter a title of up to 120 characters." },
      { status: 400 }
    );
  }

  // Retry in the unlikely case of a join code collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const session = await db.session.create({
        data: {
          title,
          joinCode: makeCode(),
          presenterToken: crypto.randomUUID(),
        },
      });
      // The presenter token is returned once and kept in the presenter's browser.
      return NextResponse.json({
        id: session.id,
        joinCode: session.joinCode,
        presenterToken: session.presenterToken,
      });
    } catch (error) {
      if (error.code !== "P2002") throw error;
    }
  }
  return NextResponse.json({ error: "Could not create a session. Try again." }, { status: 500 });
}

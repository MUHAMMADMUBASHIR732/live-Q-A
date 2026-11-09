import { NextResponse, after } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { broadcast, notifyChannel } from "@/lib/pusher-server";
import { replyLimiter } from "@/lib/ratelimit";
import { MAX_FILES, MAX_TOTAL_BYTES, MAX_TEXT, sanitizeFileName } from "@/lib/files";

export const maxDuration = 30;

const isFile = (v) => v && typeof v === "object" && typeof v.arrayBuffer === "function";

// Presenter only: send a private reply (text and files of any type) to the person who asked.
export async function POST(request, { params }) {
  const { id } = await params;

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const presenterToken = form.get("presenterToken");
  const text = String(form.get("text") || "").trim();
  const markAnswered = form.get("markAnswered") === "true";
  const files = form.getAll("files").filter((f) => isFile(f) && f.size > 0);

  if (!text && files.length === 0) {
    return NextResponse.json({ error: "Write a reply or attach a file." }, { status: 400 });
  }
  if (text.length > MAX_TEXT) {
    return NextResponse.json({ error: `Replies can be up to ${MAX_TEXT} characters.` }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `You can attach up to ${MAX_FILES} files.` }, { status: 400 });
  }
  if (files.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_BYTES) {
    return NextResponse.json({ error: "The files are too large to send." }, { status: 413 });
  }
  if (typeof presenterToken !== "string" || !presenterToken) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  // The permission check and the question lookup run at the same time.
  const [owner, question] = await Promise.all([
    db.session.findFirst({
      where: { presenterToken, questions: { some: { id } } },
      select: { id: true },
    }),
    db.question.findUnique({
      where: { id },
      select: { authorToken: true, status: true, sessionId: true },
    }),
  ]);
  if (!owner || !question) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { success } = await replyLimiter.limit(owner.id);
  if (!success) {
    return NextResponse.json({ error: "Too many replies. Wait a moment." }, { status: 429 });
  }

  const fileRows = await Promise.all(
    files.map(async (f) => ({
      id: randomUUID(),
      name: sanitizeFileName(f.name),
      size: f.size,
      mimeType: String(f.type || "application/octet-stream").slice(0, 100),
      data: Buffer.from(await f.arrayBuffer()),
    }))
  );

  // Saving the reply and (optionally) marking the question answered happen together.
  const [reply] = await Promise.all([
    db.reply.create({ data: { questionId: id, text }, select: { id: true, createdAt: true } }),
    markAnswered && question.status !== "answered"
      ? db.question.updateMany({ where: { id }, data: { status: "answered" } })
      : null,
  ]);

  if (fileRows.length > 0) {
    try {
      await db.replyFile.createMany({ data: fileRows.map((f) => ({ ...f, replyId: reply.id })) });
    } catch (error) {
      await db.reply.delete({ where: { id: reply.id } }).catch(() => {});
      console.error("Saving reply files failed:", error);
      return NextResponse.json({ error: "The files could not be saved." }, { status: 500 });
    }
  }

  const answeredNow = markAnswered && question.status !== "answered";

  // Telling the board and the asker happens after the response is sent.
  after(async () => {
    if (answeredNow) await broadcast(question.sessionId, "question:patch", { id, status: "answered" });
    // The ping holds no content. The asker fetches the reply with their own secret token.
    if (/^[A-Za-z0-9_-]{8,64}$/.test(question.authorToken)) {
      await notifyChannel(`reply-${question.authorToken}`, "reply:new", { replyId: reply.id });
    }
  });

  return NextResponse.json(
    {
      reply: {
        id: reply.id,
        questionId: id,
        text,
        createdAt: reply.createdAt.toISOString(),
        files: fileRows.map((f) => ({ id: f.id, name: f.name, size: f.size, mimeType: f.mimeType })),
      },
      patch: answeredNow ? { id, status: "answered" } : null,
    },
    { status: 201 }
  );
}

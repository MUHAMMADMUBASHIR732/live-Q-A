import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { broadcast, notifyChannel } from "@/lib/pusher-server";
import { replyLimiter } from "@/lib/ratelimit";
import { publicQuestion, publicReply } from "@/lib/serialize";
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
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > MAX_TOTAL_BYTES) {
    return NextResponse.json({ error: "The files are too large to send." }, { status: 413 });
  }

  const question = await db.question.findUnique({
    where: { id },
    include: { session: { select: { id: true, presenterToken: true } } },
  });
  if (
    !question ||
    typeof presenterToken !== "string" ||
    question.session.presenterToken !== presenterToken
  ) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { success } = await replyLimiter.limit(question.session.id);
  if (!success) {
    return NextResponse.json({ error: "Too many replies. Wait a moment." }, { status: 429 });
  }

  const fileData = await Promise.all(
    files.map(async (f) => ({
      name: sanitizeFileName(f.name),
      size: f.size,
      mimeType: String(f.type || "application/octet-stream").slice(0, 100),
      data: Buffer.from(await f.arrayBuffer()),
    }))
  );

  const reply = await db.reply.create({
    data: { questionId: id, text, files: { create: fileData } },
    include: { files: { select: { id: true, name: true, size: true, mimeType: true } } },
  });

  // Optional: also mark the question as answered on the shared board (it shows no reply content).
  let updatedQuestion = null;
  if (markAnswered && question.status !== "answered") {
    const updated = await db.question.update({
      where: { id },
      data: { status: "answered" },
      include: { cluster: true },
    });
    updatedQuestion = publicQuestion(updated);
    await broadcast(updated.sessionId, "question:updated", updatedQuestion);
  }

  // Ping only the person who asked. The ping holds no content. They fetch the reply
  // themselves with their own secret token, so nobody else can read it.
  if (/^[A-Za-z0-9_-]{8,64}$/.test(question.authorToken)) {
    await notifyChannel(`reply-${question.authorToken}`, "reply:new", { replyId: reply.id });
  }

  return NextResponse.json({ reply: publicReply(reply), question: updatedQuestion }, { status: 201 });
}

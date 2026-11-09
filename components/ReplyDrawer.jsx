"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/Button";
import FileBadge from "@/components/FileBadge";
import FileChip from "@/components/FileChip";
import { MAX_FILES, MAX_TOTAL_BYTES, MAX_TEXT, formatBytes } from "@/lib/files";

function when(iso) {
  return new Date(iso).toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
}

// The presenter's private reply sheet. Text plus files of any type, delivered to one person.
export default function ReplyDrawer({ open, question, presenterToken, previous, onClose, onSent }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [markAnswered, setMarkAnswered] = useState(false);
  const [sent, setSent] = useState(false);
  const textRef = useRef(null);
  const inputRef = useRef(null);

  // Start fresh each time a different question is opened.
  useEffect(() => {
    if (!open) return;
    setText("");
    setFiles([]);
    setError("");
    setSent(false);
    setMarkAnswered(false);
    const t = setTimeout(() => textRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [open, question?.id]);

  // Escape closes the sheet, and the page behind it does not scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  function addFiles(list) {
    setError("");
    const incoming = Array.from(list).map((f) =>
      // Screenshots pasted from the clipboard are all called "image.png": give them a real name.
      f.name === "image.png" ? new File([f], `pasted-${Date.now()}.png`, { type: f.type }) : f
    );
    const next = [...files];
    for (const f of incoming) {
      const duplicate = next.some(
        (x) => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified
      );
      if (!duplicate) next.push(f);
    }
    if (next.length > MAX_FILES) {
      setError(`You can attach up to ${MAX_FILES} files.`);
      return;
    }
    if (next.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_BYTES) {
      setError(`Files can total ${formatBytes(MAX_TOTAL_BYTES)} at most.`);
      return;
    }
    setFiles(next);
  }

  function onPaste(e) {
    if (e.clipboardData?.files?.length) {
      e.preventDefault();
      addFiles(e.clipboardData.files);
    }
  }

  async function send(e) {
    e.preventDefault();
    if (sending) return;
    if (!text.trim() && files.length === 0) {
      setError("Write a reply or attach a file.");
      return;
    }
    setSending(true);
    setError("");

    try {
      const form = new FormData();
      form.append("presenterToken", presenterToken);
      form.append("text", text);
      form.append("markAnswered", markAnswered ? "true" : "false");
      files.forEach((f) => form.append("files", f));

      const res = await fetch(`/api/questions/${question.id}/reply`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "The reply could not be sent.");

      setSent(true);
      onSent(data.reply, data.patch);
    } catch (err) {
      setError(err.message || "The reply could not be sent. Check your connection.");
    }
    setSending(false);
  }

  const asker = question?.authorName || "the person who asked";

  return (
    <div
      className={`fixed inset-0 z-50 transition-[visibility] ${open ? "visible" : "invisible delay-200"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink/60 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reply-title"
        onPaste={onPaste}
        className={`absolute inset-y-0 right-0 flex w-full max-w-lg flex-col overflow-y-auto border-l-2 border-ink bg-paper text-ink transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b-2 border-ink px-5 py-4">
          <div>
            <h2 id="reply-title" className="text-2xl font-bold tracking-tight">
              Private reply
            </h2>
            <p className="text-sm text-ink/80">
              Only {question?.authorName || "the person who asked"} will see this.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 space-y-5 px-5 py-5">
          {question && (
            <blockquote className="border-l-4 border-pine bg-sheet px-4 py-3">
              <p className="font-mono text-xs text-ink/70">{question.authorName || "Anonymous"} asked</p>
              <p className="mt-1 text-lg leading-snug">{question.text}</p>
            </blockquote>
          )}

          {sent ? (
            <div className="border-2 border-ink bg-sage/30 p-5">
              <h3 className="text-2xl font-bold tracking-tight">Delivered privately</h3>
              <p className="mt-1">
                {question?.authorName || "The person who asked"} can see it on the device they used.
                Nobody else in the room can.
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSent(false);
                    setText("");
                    setFiles([]);
                  }}
                >
                  Send another
                </Button>
                <Button size="sm" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={send} className="space-y-4">
              <div>
                <label htmlFor="reply-text" className="block font-semibold">
                  Your reply to {asker}
                </label>
                <textarea
                  id="reply-text"
                  ref={textRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={MAX_TEXT}
                  rows={5}
                  placeholder="Write your answer. You can also paste a file or screenshot here."
                  className="mt-2 w-full resize-none rounded-[3px] border-2 border-ink bg-sheet p-3 text-lg leading-snug placeholder:text-ink/55"
                />
                <p className="mt-1 text-right font-mono text-xs text-ink/70">
                  {text.length}/{MAX_TEXT}
                </p>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  addFiles(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed p-5 text-center transition-colors ${
                  dragging ? "border-pine bg-sage/30" : "border-ink/50 bg-sheet"
                }`}
              >
                <p className="font-semibold">Drop files here, or paste one</p>
                <p className="mt-1 text-sm text-ink/80">
                  Any file type. Up to {MAX_FILES} files, {formatBytes(MAX_TOTAL_BYTES)} in total.
                </p>
                <div className="mt-3">
                  <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
                    Choose files
                  </Button>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>

              {files.length > 0 && (
                <ul className="space-y-2">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${f.size}-${i}`}>
                      <FileBadge name={f.name} size={f.size} mimeType={f.type}>
                        <button
                          type="button"
                          onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                          aria-label={`Remove ${f.name}`}
                          className="shrink-0 border border-ink px-3 py-1 text-sm transition-colors hover:bg-ink hover:text-paper"
                        >
                          Remove
                        </button>
                      </FileBadge>
                    </li>
                  ))}
                </ul>
              )}

              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={markAnswered}
                  onChange={(e) => setMarkAnswered(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#35584d]"
                />
                <span>
                  Also mark this question as answered on the shared board.
                  <span className="block text-ink/75">Everyone sees the label. Nobody sees your reply.</span>
                </span>
              </label>

              <p role="alert" className="min-h-5 text-sm font-semibold">
                {error}
              </p>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={sending}>
                  {sending ? "Sending..." : "Send privately"}
                </Button>
              </div>
            </form>
          )}

          {previous && previous.length > 0 && (
            <div className="border-t-2 border-ink pt-5">
              <h3 className="text-lg font-bold tracking-tight">Already sent</h3>
              <ul className="mt-3 space-y-3">
                {previous.map((r) => (
                  <li key={r.id} className="border border-ink/50 bg-sheet p-3">
                    <p className="font-mono text-xs text-ink/70">{when(r.createdAt)}</p>
                    {r.text && <p className="mt-1 whitespace-pre-wrap break-words">{r.text}</p>}
                    {r.files.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {r.files.map((f) => (
                          <FileChip key={f.id} file={f} tokens={{ presenterToken }} />
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

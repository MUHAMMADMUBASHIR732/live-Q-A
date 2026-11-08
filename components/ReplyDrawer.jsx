"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/Button";
import HexIcon from "@/components/HexIcon";
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
    const t = setTimeout(() => textRef.current?.focus(), 250);
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
      onSent(data.reply, data.question);
    } catch (err) {
      setError(err.message || "The reply could not be sent. Check your connection.");
    }
    setSending(false);
  }

  const who = question?.authorName || "the person who asked";

  return (
    <div
      className={`fixed inset-0 z-50 transition-[visibility] ${open ? "visible" : "invisible delay-300"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reply-title"
        onPaste={onPaste}
        className={`absolute inset-y-0 right-0 flex w-full max-w-lg flex-col overflow-y-auto bg-paper text-ink shadow-[-30px_0_80px_-30px_rgba(34,51,59,0.7)] transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <HexIcon size={44} tone="sand">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <rect x="3" y="7" width="10" height="7" rx="2" />
                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" strokeLinecap="round" />
              </svg>
            </HexIcon>
            <div>
              <h2 id="reply-title" className="font-display text-3xl leading-none">
                Private reply
              </h2>
              <p className="mt-1 text-sm text-ink/70">
                Only {question?.authorName || "the asker"} will see this.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-ink/70 transition-colors hover:bg-ink/10 hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-5 px-6 py-5">
          {question && (
            <blockquote className="rounded-2xl border border-ink/10 bg-ink/[0.04] p-4">
              <p className="text-sm text-ink/65">{question.authorName || "Anonymous"} asked</p>
              <p className="mt-1 text-lg leading-snug">{question.text}</p>
            </blockquote>
          )}

          {sent ? (
            <div className="arrive rounded-2xl border border-sage/60 bg-sage/15 p-6 text-center">
              <div className="flex justify-center">
                <HexIcon size={56} tone="ink">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M5 11.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </HexIcon>
              </div>
              <h3 className="mt-3 font-display text-3xl">Delivered privately</h3>
              <p className="mx-auto mt-1 max-w-[34ch] text-ink/75">
                {question?.authorName || "The person who asked"} can see it on the device they used.
                Nobody else in the room can.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => { setSent(false); setText(""); setFiles([]); }}>
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
                <label htmlFor="reply-text" className="block font-medium">
                  Your reply to {who}
                </label>
                <textarea
                  id="reply-text"
                  ref={textRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={MAX_TEXT}
                  rows={5}
                  placeholder="Write your answer. You can also paste a file or screenshot here."
                  className="mt-2 w-full resize-none rounded-2xl border border-ink/30 bg-paper p-4 text-lg leading-snug transition-[border-color,box-shadow] placeholder:text-ink/45 focus:border-ink focus:shadow-[0_0_0_4px_rgba(94,139,126,0.25)]"
                />
                <p className="mt-1 text-right font-mono text-xs text-ink/60">
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
                className={`rounded-2xl border-2 border-dashed p-5 text-center transition-colors duration-300 ${
                  dragging ? "border-sage bg-sage/20" : "border-ink/25 bg-ink/[0.03] hover:border-ink/45"
                }`}
              >
                <p className="font-medium">Drop files here, or paste one</p>
                <p className="mt-1 text-sm text-ink/70">
                  Any file type. Up to {MAX_FILES} files, {formatBytes(MAX_TOTAL_BYTES)} in total.
                </p>
                <div className="mt-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
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
                    <li key={`${f.name}-${f.size}-${i}`} className="arrive">
                      <FileBadge name={f.name} size={f.size} mimeType={f.type}>
                        <button
                          type="button"
                          onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                          aria-label={`Remove ${f.name}`}
                          className="shrink-0 rounded-full border border-ink/30 px-3 py-1 text-sm transition-colors hover:bg-ink hover:text-paper"
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
                  className="mt-0.5 h-4 w-4 accent-[#22333B]"
                />
                <span>
                  Also mark this question as answered on the shared board.
                  <span className="block text-ink/65">Everyone sees the label. Nobody sees your reply.</span>
                </span>
              </label>

              <p role="alert" className="min-h-5 text-sm font-medium">
                {error}
              </p>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={sending}>
                  {sending ? "Sending..." : "Send privately"}
                </Button>
              </div>
            </form>
          )}

          {previous && previous.length > 0 && (
            <div className="border-t border-ink/10 pt-5">
              <h3 className="font-display text-2xl">Already sent</h3>
              <ul className="mt-3 space-y-3">
                {previous.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-4">
                    <p className="font-mono text-xs text-ink/60">{when(r.createdAt)}</p>
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

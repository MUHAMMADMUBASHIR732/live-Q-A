"use client";

import { useEffect, useState } from "react";
import FileChip from "@/components/FileChip";
import { getVoterToken } from "@/lib/voter";

function when(iso) {
  return new Date(iso).toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
}

const clip = (text, n = 90) => (text.length > n ? `${text.slice(0, n).trimEnd()}...` : text);

// Replies the presenter sent to THIS person. Nobody else's device ever receives them.
export default function PrivateInbox({ sessionId, replies }) {
  const [seen, setSeen] = useState(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(getVoterToken());
    try {
      setSeen(new Set(JSON.parse(localStorage.getItem(`seenReplies:${sessionId}`) || "[]")));
    } catch {
      setSeen(new Set());
    }
  }, [sessionId]);

  const unseen = seen ? replies.filter((r) => !seen.has(r.id)) : [];

  // After a few seconds on screen, a reply stops being "new".
  useEffect(() => {
    if (!seen || unseen.length === 0) return;
    const timer = setTimeout(() => {
      const next = new Set([...seen, ...unseen.map((r) => r.id)]);
      localStorage.setItem(`seenReplies:${sessionId}`, JSON.stringify([...next]));
      setSeen(next);
    }, 6000);
    return () => clearTimeout(timer);
  }, [seen, replies, unseen.length, sessionId]);

  if (replies.length === 0) return null;
  const isNew = (id) => unseen.some((r) => r.id === id);

  return (
    <section
      aria-label="Private replies from the presenter"
      className="mt-6 border-2 border-ink bg-sand p-4"
    >
      <h2 className="text-xl font-bold tracking-tight">Private from the presenter</h2>
      <p className="text-sm">
        Only you can see {replies.length === 1 ? "this reply" : "these replies"}. Nobody else in the
        room can.
      </p>

      <ul className="mt-3 space-y-3">
        {replies.map((r) => (
          <li key={r.id} className={`border-2 border-ink bg-sheet p-3 ${isNew(r.id) ? "arrive" : ""}`}>
            <p className="text-sm text-ink/75">
              In reply to <span className="italic">{clip(r.questionText)}</span>
            </p>
            {r.text && (
              <p className="mt-2 whitespace-pre-wrap break-words text-lg leading-snug">{r.text}</p>
            )}
            {r.files.length > 0 && (
              <div className="mt-3 space-y-2">
                {r.files.map((f) => (
                  <FileChip key={f.id} file={f} tokens={{ voterToken: token }} />
                ))}
              </div>
            )}
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/75">
              <span className="font-mono">{when(r.createdAt)}</span>
              {isNew(r.id) && <span className="bg-ink px-1.5 py-0.5 font-medium text-paper">New</span>}
              {r.files.length > 0 && <span>Files come from the presenter. Open only files you trust.</span>}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

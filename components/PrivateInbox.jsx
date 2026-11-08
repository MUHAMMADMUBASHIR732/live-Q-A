"use client";

import { useEffect, useState } from "react";
import HexIcon from "@/components/HexIcon";
import FileChip from "@/components/FileChip";
import { getVoterToken } from "@/lib/voter";

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="2" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" strokeLinecap="round" />
    </svg>
  );
}

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
    <section aria-label="Private replies from the presenter" className="mt-6">
      <div className="flex items-center gap-3">
        <HexIcon size={38} tone="sand">
          <LockIcon />
        </HexIcon>
        <div>
          <h2 className="font-display text-[1.7rem] leading-none">Private from the presenter</h2>
          <p className="mt-1 text-sm text-ink/70">
            Only you can see {replies.length === 1 ? "this reply" : "these replies"}.
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-3">
        {replies.map((r) => (
          <li
            key={r.id}
            className={`rounded-2xl border border-sand/70 bg-sand/15 p-4 ${isNew(r.id) ? "arrive" : ""}`}
          >
            <p className="text-sm text-ink/65">
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
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/65">
              <span className="font-mono">{when(r.createdAt)}</span>
              {isNew(r.id) && (
                <span className="rounded-md bg-ink px-1.5 py-0.5 font-medium text-paper">New</span>
              )}
              {r.files.length > 0 && <span>Files come from the presenter. Open only files you trust.</span>}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

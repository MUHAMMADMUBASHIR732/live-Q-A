"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import LiveDot from "@/components/LiveDot";
import { useLiveQuestions } from "@/hooks/useLiveQuestions";
import { useFlip } from "@/hooks/useFlip";
import { useFreshIds } from "@/hooks/useFreshIds";
import { getVoterToken } from "@/lib/voter";
import { sortQuestions } from "@/lib/sort";

export default function AudienceView({ session, initialQuestions }) {
  const { questions, closed, upsert } = useLiveQuestions(
    session.id,
    initialQuestions,
    session.status === "closed"
  );
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [voted, setVoted] = useState(() => new Set());
  const fresh = useFreshIds(questions);
  const listRef = useFlip(questions);

  // Remember which questions this person already upvoted.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`voted:${session.id}`) || "[]");
      setVoted(new Set(saved));
    } catch {
      setVoted(new Set());
    }
  }, [session.id]);

  function saveVotes(next) {
    setVoted(next);
    localStorage.setItem(`voted:${session.id}`, JSON.stringify([...next]));
  }

  async function submitQuestion(e) {
    e.preventDefault();
    if (!text.trim() || sending || closed) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          joinCode: session.joinCode,
          text,
          voterToken: getVoterToken(),
        }),
      });

      if (res.ok) {
        upsert(await res.json()); // show it straight away; the live update will not duplicate it
        setText("");
      } else if (res.status === 429) {
        setError("You are sending questions too fast. Wait a minute and try again.");
      } else if (res.status === 403) {
        setError("This session has ended, so new questions are closed.");
      } else {
        setError("Your question was not sent. Check your connection and try again.");
      }
    } catch {
      setError("Your question was not sent. Check your connection and try again.");
    }
    setSending(false);
  }

  async function upvote(id) {
    if (voted.has(id) || closed) return;
    const previous = voted;
    saveVotes(new Set(voted).add(id)); // optimistic: highlight immediately

    try {
      const res = await fetch("/api/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: id, voterToken: getVoterToken() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.question) upsert(data.question);
      } else if (res.status !== 409) {
        // 409 means the server already has this vote, so keep it. Anything else rolls back.
        saveVotes(previous);
      }
    } catch {
      saveVotes(previous);
    }
  }

  const sorted = sortQuestions(questions);

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-4 pb-16 sm:px-6">
      <header className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-ink/10 bg-paper/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Link href="/" aria-label="Askboard home">
          <Logo className="text-lg" />
        </Link>
        <p className="flex items-center gap-2 text-sm text-ink/75">
          <LiveDot closed={closed} />
          {closed ? "Ended" : "Live"}
          <span className="font-semibold tracking-widest">{session.joinCode}</span>
        </p>
      </header>

      <h1 className="mt-8 font-display text-3xl font-semibold leading-tight tracking-tight">
        {session.title}
      </h1>

      {closed && (
        <p role="status" className="arrive mt-4 rounded-xl bg-sand/30 px-4 py-3 font-medium">
          This session has ended. You can still read the questions.
        </p>
      )}

      {!closed && (
        <form
          onSubmit={submitQuestion}
          className="mt-6 rounded-2xl border border-ink/15 bg-ink/[0.04] p-4 transition-[border-color,background-color] duration-300 focus-within:border-ink/40 focus-within:bg-ink/[0.06]"
        >
          <label htmlFor="question" className="block font-medium">
            Ask a question
          </label>
          <textarea
            id="question"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submitQuestion(e);
            }}
            maxLength={280}
            rows={3}
            placeholder="What would you like to know?"
            className="mt-2 w-full resize-none rounded-xl border border-ink/30 bg-paper p-3 text-lg transition-colors placeholder:text-ink/50 focus:border-ink"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span
              className={`text-sm transition-colors ${
                text.length > 260 ? "font-semibold text-ink" : "text-ink/70"
              }`}
            >
              {text.length}/280
            </span>
            <Button type="submit" disabled={sending || !text.trim()}>
              {sending ? "Sending..." : "Send question"}
            </Button>
          </div>
          <p role="alert" className="mt-2 min-h-5 text-sm font-medium">
            {error}
          </p>
        </form>
      )}

      {sorted.length === 0 ? (
        <div className="mt-12 flex flex-col items-center text-center text-ink/75">
          <div className="flex items-center gap-1.5 rounded-full bg-ink/[0.06] px-5 py-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 animate-bounce rounded-full bg-sage"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <p className="mt-4 text-lg">No questions yet. Ask the first one.</p>
        </div>
      ) : (
        <ul ref={listRef} className="relative mt-6 space-y-3">
          {sorted.map((q) => {
            const isVoted = voted.has(q.id);
            return (
              <li
                key={q.id}
                data-flip-id={q.id}
                className={`flex gap-3 rounded-2xl border p-4 transition-colors duration-300 ${
                  q.status === "pinned"
                    ? "border-sand bg-sand/20"
                    : "border-ink/10 bg-ink/[0.04] hover:border-ink/25 hover:bg-ink/[0.07]"
                } ${fresh.has(q.id) ? "arrive" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => upvote(q.id)}
                  disabled={closed}
                  aria-pressed={isVoted}
                  aria-label={`Upvote this question. It has ${q.upvoteCount} votes.`}
                  className={`group/vote flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl border font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-90 disabled:cursor-not-allowed ${
                    isVoted
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/30 hover:border-ink hover:bg-ink/10"
                  }`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover/vote:-translate-y-0.5"
                  >
                    <path
                      d="M2 9l5-5 5 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span key={q.upvoteCount} className="pop">
                    {q.upvoteCount}
                  </span>
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {q.clusterLabel && (
                      <span className="rounded-md bg-sage/20 px-2 py-0.5 text-sm font-medium">
                        {q.clusterLabel}
                      </span>
                    )}
                    {q.status === "pinned" && (
                      <span className="rounded-md bg-sand px-2 py-0.5 text-sm font-medium">
                        Pinned
                      </span>
                    )}
                    {q.status === "answered" && (
                      <span className="rounded-md bg-ink px-2 py-0.5 text-sm font-medium text-paper">
                        Answered
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1 break-words text-lg leading-snug ${
                      q.status === "answered" ? "text-ink/60" : ""
                    }`}
                  >
                    {q.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

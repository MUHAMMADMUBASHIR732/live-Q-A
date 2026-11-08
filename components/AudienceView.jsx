"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import LiveDot from "@/components/LiveDot";
import HexIcon from "@/components/HexIcon";
import PrivateInbox from "@/components/PrivateInbox";
import { useLiveQuestions } from "@/hooks/useLiveQuestions";
import { useMyReplies } from "@/hooks/useMyReplies";
import { useFlip } from "@/hooks/useFlip";
import { useFreshIds } from "@/hooks/useFreshIds";
import { getVoterToken } from "@/lib/voter";
import { sortQuestions } from "@/lib/sort";

const initial = (name) => (name ? name.trim()[0].toUpperCase() : "?");

export default function AudienceView({ session, initialQuestions }) {
  const { questions, closed, upsert } = useLiveQuestions(
    session.id,
    initialQuestions,
    session.status === "closed"
  );
  const { replies } = useMyReplies(session.id);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [voted, setVoted] = useState(() => new Set());
  const [mine, setMine] = useState(() => new Set());
  const fresh = useFreshIds(questions);
  const listRef = useFlip(questions);

  // Restore this person's votes, own questions, and name from this browser.
  useEffect(() => {
    try {
      setVoted(new Set(JSON.parse(localStorage.getItem(`voted:${session.id}`) || "[]")));
      setMine(new Set(JSON.parse(localStorage.getItem(`mine:${session.id}`) || "[]")));
    } catch {
      /* ignore corrupted storage */
    }
    setName(localStorage.getItem("voterName") || "");
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
          name,
          voterToken: getVoterToken(),
        }),
      });

      if (res.ok) {
        const created = await res.json();
        upsert(created); // show it straight away; the live update will not duplicate it
        const nextMine = new Set(mine).add(created.id);
        setMine(nextMine);
        localStorage.setItem(`mine:${session.id}`, JSON.stringify([...nextMine]));
        localStorage.setItem("voterName", name.trim());
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
    <main className="mx-auto min-h-dvh max-w-xl px-4 pb-20 sm:px-6">
      <header className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-ink/10 bg-paper/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Link href="/" aria-label="Hexa AskBoard home">
          <Logo className="scale-90 origin-left" />
        </Link>
        <p className="flex items-center gap-2 text-sm text-ink/75">
          <LiveDot closed={closed} />
          {closed ? "Ended" : "Live"}
          <span className="rounded-md border border-ink/15 px-1.5 py-0.5 font-mono text-xs font-semibold tracking-widest">
            {session.joinCode}
          </span>
        </p>
      </header>

      <h1 className="mt-9 font-display text-[2.6rem] leading-[1.02]">{session.title}</h1>

      <PrivateInbox sessionId={session.id} replies={replies} />

      {closed && (
        <p role="status" className="arrive mt-4 rounded-2xl bg-sand/30 px-4 py-3 font-medium">
          This session has ended. You can still read the questions.
        </p>
      )}

      {!closed && (
        <form
          onSubmit={submitQuestion}
          className="mt-6 rounded-[1.75rem] border border-ink/15 bg-ink/[0.04] p-4 transition-[border-color,background-color] duration-300 focus-within:border-ink/40 focus-within:bg-ink/[0.06] sm:p-5"
        >
          <label htmlFor="question" className="block font-display text-2xl">
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
            className="mt-2 w-full resize-none rounded-2xl border border-ink/30 bg-paper p-3.5 text-lg transition-colors placeholder:text-ink/50 focus:border-ink"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="asker-name" className="sr-only">
                Your name (optional)
              </label>
              <input
                id="asker-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                placeholder="Your name (optional)"
                className="w-full rounded-full border border-ink/25 bg-paper px-4 py-2 text-sm transition-colors placeholder:text-ink/50 focus:border-ink"
              />
            </div>
            <span
              className={`font-mono text-xs transition-colors ${
                text.length > 260 ? "font-semibold text-ink" : "text-ink/65"
              }`}
            >
              {text.length}/280
            </span>
            <Button type="submit" disabled={sending || !text.trim()}>
              {sending ? "Sending..." : "Send question"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-ink/65">
            Your name is shown with your question. The presenter can reply to you privately.
          </p>
          <p role="alert" className="mt-1 min-h-5 text-sm font-medium">
            {error}
          </p>
        </form>
      )}

      {sorted.length === 0 ? (
        <div className="mt-14 flex flex-col items-center text-center text-ink/75">
          <div className="flex items-center gap-1.5 rounded-full bg-ink/[0.06] px-5 py-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 animate-bounce rounded-full bg-sage"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <p className="mt-4 font-display text-3xl">No questions yet</p>
          <p className="mt-1">Ask the first one.</p>
        </div>
      ) : (
        <ul ref={listRef} className="relative mt-6 space-y-3">
          {sorted.map((q) => {
            const isVoted = voted.has(q.id);
            const isMine = mine.has(q.id);
            return (
              <li
                key={q.id}
                data-flip-id={q.id}
                className={`flex gap-3 rounded-[1.4rem] border p-4 transition-colors duration-300 ${
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
                  <span key={q.upvoteCount} className="pop font-mono text-sm">
                    {q.upvoteCount}
                  </span>
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 text-sm text-ink/75">
                      <HexIcon size={22} tone={isMine ? "ink" : "outline"}>
                        <span className="font-mono text-[9px] font-semibold">{initial(q.authorName)}</span>
                      </HexIcon>
                      {isMine ? "You" : q.authorName || "Anonymous"}
                    </span>
                    {q.clusterLabel && (
                      <span className="rounded-md bg-sage/20 px-2 py-0.5 text-sm font-medium">
                        {q.clusterLabel}
                      </span>
                    )}
                    {q.status === "pinned" && (
                      <span className="rounded-md bg-sand px-2 py-0.5 text-sm font-medium">Pinned</span>
                    )}
                    {q.status === "answered" && (
                      <span className="rounded-md bg-ink px-2 py-0.5 text-sm font-medium text-paper">
                        Answered
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1.5 break-words text-lg leading-snug ${
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

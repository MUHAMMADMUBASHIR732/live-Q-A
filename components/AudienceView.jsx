"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import LiveDot from "@/components/LiveDot";
import JoinForm from "@/components/JoinForm";
import ScanButton from "@/components/ScanButton";
import PrivateInbox from "@/components/PrivateInbox";
import { useRoom } from "@/hooks/useRoom";
import { useFlip } from "@/hooks/useFlip";
import { useFreshIds } from "@/hooks/useFreshIds";
import { getVoterToken } from "@/lib/voter";
import { sortQuestions } from "@/lib/sort";

export default function AudienceView({ code }) {
  const { session, questions, replies, status, closed, add, patch } = useRoom({
    code,
    withReplies: true,
  });
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [voted, setVoted] = useState(() => new Set());
  const [mine, setMine] = useState(() => new Set());
  const fresh = useFreshIds(questions);
  const listRef = useFlip(questions);
  const sessionId = session?.id;

  // Restore this person's votes, own questions, and name from this browser.
  useEffect(() => {
    if (!sessionId) return;
    try {
      setVoted(new Set(JSON.parse(localStorage.getItem(`voted:${sessionId}`) || "[]")));
      setMine(new Set(JSON.parse(localStorage.getItem(`mine:${sessionId}`) || "[]")));
    } catch {
      /* ignore corrupted storage */
    }
  }, [sessionId]);

  useEffect(() => {
    setName(localStorage.getItem("voterName") || "");
  }, []);

  function saveVotes(next) {
    setVoted(next);
    localStorage.setItem(`voted:${sessionId}`, JSON.stringify([...next]));
  }

  async function submitQuestion(e) {
    e.preventDefault();
    if (!text.trim() || sending || closed || !session) return;
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
        add(created); // appears at once; the live update will not duplicate it
        const nextMine = new Set(mine).add(created.id);
        setMine(nextMine);
        localStorage.setItem(`mine:${sessionId}`, JSON.stringify([...nextMine]));
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
    saveVotes(new Set(voted).add(id)); // the button turns green straight away

    try {
      const res = await fetch("/api/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: id, voterToken: getVoterToken() }),
      });
      if (res.ok) {
        const data = await res.json();
        patch({ id, upvoteCount: data.upvoteCount });
      } else if (res.status !== 409) {
        // 409 means the server already has this vote, so keep it. Anything else rolls back.
        saveVotes(previous);
      }
    } catch {
      saveVotes(previous);
    }
  }

  if (status === "missing") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-10">
        <Link href="/" aria-label="Hexa AskBoard home" className="w-fit">
          <Logo />
        </Link>
        <h1 className="mt-10 text-5xl font-bold leading-[0.95] tracking-tighter">
          We could not find that session
        </h1>
        <p className="mt-4 text-lg">
          Check the code with the presenter, or scan it again. Codes have six characters.
        </p>
        <div className="mt-6 flex flex-wrap items-stretch gap-3">
          <JoinForm />
          <ScanButton>Scan a code</ScanButton>
        </div>
      </main>
    );
  }

  const sorted = sortQuestions(questions);
  const loading = status === "loading";

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-4 pb-20 sm:px-6">
      <header className="flex items-center justify-between border-b-2 border-ink py-3">
        <Link href="/" aria-label="Hexa AskBoard home">
          <Logo className="scale-90 origin-left" />
        </Link>
        <p className="flex items-center gap-2 text-sm">
          <LiveDot closed={closed} />
          {closed ? "Ended" : "Live"}
          <span className="border border-ink px-1.5 py-0.5 font-mono text-xs font-medium tracking-widest">
            {code}
          </span>
        </p>
      </header>

      <h1 className="mt-8 min-h-[3rem] text-4xl font-bold leading-[0.98] tracking-tighter">
        {session ? session.title : <span className="font-mono text-base font-normal text-ink/70">Opening the session...</span>}
      </h1>

      {session && <PrivateInbox sessionId={session.id} replies={replies} />}

      {closed && (
        <p role="status" className="mt-4 border-2 border-ink bg-sand p-3 font-semibold">
          This session has ended. You can still read the questions.
        </p>
      )}

      {session && !closed && (
        <form onSubmit={submitQuestion} className="mt-6 border-2 border-ink bg-sheet p-4">
          <label htmlFor="question" className="block text-xl font-bold tracking-tight">
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
            className="mt-2 w-full resize-none rounded-[3px] border-2 border-ink bg-paper p-3 text-lg placeholder:text-ink/55"
          />
          <label htmlFor="asker-name" className="sr-only">
            Your name (optional)
          </label>
          <input
            id="asker-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Your name (optional)"
            className="mt-3 w-full rounded-[3px] border-2 border-ink bg-paper px-3 py-2 placeholder:text-ink/55"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className={`font-mono text-xs ${text.length > 260 ? "font-medium" : "text-ink/70"}`}>
              {text.length}/280
            </span>
            <Button type="submit" disabled={sending || !text.trim()}>
              {sending ? "Sending..." : "Send question"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-ink/75">
            Your name is shown with your question. The presenter can reply to you privately.
          </p>
          <p role="alert" className="mt-1 min-h-5 text-sm font-semibold">
            {error}
          </p>
        </form>
      )}

      {loading ? (
        <p className="mt-10 font-mono text-sm text-ink/70">Loading questions...</p>
      ) : sorted.length === 0 ? (
        <div className="mt-12">
          <p className="text-3xl font-bold tracking-tight">No questions yet</p>
          <p className="mt-1 text-ink/80">Ask the first one.</p>
        </div>
      ) : (
        <ul ref={listRef} className="relative mt-6 border-t-2 border-ink">
          {sorted.map((q) => {
            const isVoted = voted.has(q.id);
            const isMine = mine.has(q.id);
            return (
              <li
                key={q.id}
                data-flip-id={q.id}
                className={`grid grid-cols-[3.25rem_1fr] gap-3 border-b border-ink/40 py-4 ${
                  q.status === "pinned" ? "-mx-3 border-l-4 border-l-pine bg-sand/40 px-3" : ""
                } ${fresh.has(q.id) ? "arrive" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => upvote(q.id)}
                  disabled={closed}
                  aria-pressed={isVoted}
                  aria-label={`Upvote this question. It has ${q.upvoteCount} votes.`}
                  className={`flex h-14 w-[3.25rem] flex-col items-center justify-center border-2 border-ink transition-colors disabled:cursor-not-allowed ${
                    isVoted ? "bg-pine text-paper" : "bg-sheet hover:bg-sand"
                  }`}
                >
                  <svg width="12" height="9" viewBox="0 0 12 9" aria-hidden="true">
                    <path d="M6 0l6 9H0z" fill="currentColor" />
                  </svg>
                  <span className="font-mono text-sm font-medium">{q.upvoteCount}</span>
                </button>

                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-ink/75">
                    <span>{isMine ? "You" : q.authorName || "Anonymous"}</span>
                    {q.clusterLabel && <span className="bg-sage/40 px-1.5 py-0.5 text-ink">{q.clusterLabel}</span>}
                    {q.status === "pinned" && <span className="bg-sand px-1.5 py-0.5 text-ink">Pinned</span>}
                    {q.status === "answered" && <span className="bg-ink px-1.5 py-0.5 text-paper">Answered</span>}
                  </p>
                  <p
                    className={`mt-1 break-words text-lg leading-snug ${
                      q.status === "answered" ? "text-ink/65" : ""
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

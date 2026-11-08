"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import LiveDot from "@/components/LiveDot";
import HexIcon from "@/components/HexIcon";
import HexGrid from "@/components/HexGrid";
import AnimatedNumber from "@/components/AnimatedNumber";
import ReplyDrawer from "@/components/ReplyDrawer";
import { useLiveQuestions } from "@/hooks/useLiveQuestions";
import { useFlip } from "@/hooks/useFlip";
import { useFreshIds } from "@/hooks/useFreshIds";
import { sortQuestions } from "@/lib/sort";

const OTHER = "Other questions";
const initial = (name) => (name ? name.trim()[0].toUpperCase() : "?");

export default function PresenterBoard({ session, initialQuestions }) {
  const { questions, closed, setClosed, upsert } = useLiveQuestions(
    session.id,
    initialQuestions,
    session.status === "closed"
  );
  const [token, setToken] = useState(null);
  const [origin, setOrigin] = useState("");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [repliesByQuestion, setRepliesByQuestion] = useState({});
  const [replyTo, setReplyTo] = useState(null); // the question being answered privately
  const fresh = useFreshIds(questions);
  const listRef = useFlip(questions);

  useEffect(() => {
    setToken(localStorage.getItem(`presenter:${session.id}`));
    // Use the configured public address, unless it is localhost (phones cannot open that).
    const configured = process.env.NEXT_PUBLIC_APP_URL;
    setOrigin(
      configured && !configured.includes("localhost") ? configured : window.location.origin
    );
  }, [session.id]);

  // The presenter's own record of private replies already sent.
  const loadReplies = useCallback(
    async (presenterToken) => {
      try {
        const res = await fetch(`/api/sessions/${session.id}/replies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ presenterToken }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const map = {};
        for (const r of data.replies) (map[r.questionId] ||= []).push(r);
        setRepliesByQuestion(map);
      } catch {
        /* the next load will catch up */
      }
    },
    [session.id]
  );

  useEffect(() => {
    if (token) loadReplies(token);
  }, [token, loadReplies]);

  const isPresenter = Boolean(token);
  const joinUrl = `${origin}/join/${session.joinCode}`;
  const totalVotes = questions.reduce((sum, q) => sum + q.upvoteCount, 0);
  const repliedCount = Object.keys(repliesByQuestion).length;

  // Group by AI topic. Topics with the most votes come first.
  const groups = useMemo(() => {
    const sorted = sortQuestions(questions);
    const hasTopics = sorted.some((q) => q.clusterLabel);
    const map = new Map();
    for (const q of sorted) {
      const key = hasTopics ? q.clusterLabel || OTHER : "Questions";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(q);
    }
    const votes = (list) => list.reduce((sum, q) => sum + q.upvoteCount, 0);
    return [...map.entries()].sort(
      (a, b) => (a[0] === OTHER) - (b[0] === OTHER) || votes(b[1]) - votes(a[1])
    );
  }, [questions]);

  async function setStatus(id, status) {
    setMessage("");
    const res = await fetch(`/api/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, presenterToken: token }),
    });
    if (res.ok) upsert(await res.json());
    else setMessage("That action was not allowed. Use the browser where you created the session.");
  }

  async function toggleSession() {
    setMessage("");
    const next = closed ? "open" : "closed";
    const res = await fetch(`/api/sessions/${session.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, presenterToken: token }),
    });
    if (res.ok) setClosed(next === "closed");
    else setMessage("That action was not allowed. Use the browser where you created the session.");
  }

  async function makeSummary() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/sessions/${session.id}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presenterToken: token }),
      });
      const data = await res.json();
      if (res.ok) setSummary(data.summary);
      else setMessage(data.error || "The summary could not be created.");
    } catch {
      setMessage("The summary could not be created. Check your connection.");
    }
    setBusy(false);
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setMessage("Copy failed. Select the text and copy it manually.");
    }
  }

  function handleSent(reply, updatedQuestion) {
    setRepliesByQuestion((prev) => ({
      ...prev,
      [reply.questionId]: [reply, ...(prev[reply.questionId] || [])],
    }));
    if (updatedQuestion) upsert(updatedQuestion);
  }

  const closeReply = useCallback(() => setReplyTo(null), []);
  const activeQuestion = replyTo ? questions.find((q) => q.id === replyTo) || null : null;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-ink text-paper">
      {/* A faint hexagon lattice fades in from the top right. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] text-paper/[0.07]"
        style={{
          maskImage: "radial-gradient(60% 100% at 85% 0%, black, transparent 75%)",
          WebkitMaskImage: "radial-gradient(60% 100% at 85% 0%, black, transparent 75%)",
        }}
      >
        <HexGrid id="presenter-hex" size={30} />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Link href="/" aria-label="Hexa AskBoard home">
              <Logo onDark className="scale-90 origin-left" />
            </Link>
            <p className="flex items-center gap-2 text-sm text-paper/80">
              <LiveDot closed={closed} onDark />
              {closed ? "Session ended" : "Live"}
            </p>
          </div>
          {isPresenter && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghostDark" size="sm" onClick={makeSummary} disabled={busy}>
                {busy ? "Summarizing..." : "Summarize questions"}
              </Button>
              <Button variant="ghostDark" size="sm" onClick={toggleSession}>
                {closed ? "Reopen session" : "End session"}
              </Button>
            </div>
          )}
        </header>

        <div className="mt-9 grid gap-8 lg:grid-cols-[310px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[1.75rem] bg-paper p-5 text-ink shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)] transition-transform duration-500 hover:-rotate-1 hover:scale-[1.02]">
              <div className="mx-auto w-fit rounded-xl bg-paper">
                {origin && (
                  <QRCodeSVG
                    value={joinUrl}
                    size={210}
                    level="M"
                    marginSize={1}
                    bgColor="#EFF3F1"
                    fgColor="#22333B"
                  />
                )}
              </div>
              <p className="mt-4 text-center text-sm text-ink/75">Scan to ask a question</p>
              <p className="mt-1 text-center font-mono text-3xl font-semibold tracking-[0.2em]">
                {session.joinCode}
              </p>
              <p className="mt-2 break-all text-center font-mono text-xs text-ink/65">{joinUrl}</p>
            </div>

            <dl className="grid grid-cols-3 gap-3">
              {[
                ["Questions", questions.length],
                ["Votes", totalVotes],
                ["Replied", repliedCount],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-paper/10 bg-paper/[0.05] p-3.5 transition-colors duration-300 hover:bg-paper/[0.1]"
                >
                  <dd className="font-display text-4xl leading-none">
                    <AnimatedNumber value={value} />
                  </dd>
                  <dt className="mt-1 text-xs text-paper/70">{label}</dt>
                </div>
              ))}
            </dl>

            {!isPresenter && (
              <p className="rounded-2xl border border-paper/10 bg-paper/[0.05] p-4 text-sm text-paper/80">
                You are viewing this board. Moderation and private replies are available in the
                browser where the session was created.
              </p>
            )}
          </aside>

          <section aria-live="polite">
            <h1 className="font-display text-5xl leading-[1.02] sm:text-6xl">{session.title}</h1>

            {closed && (
              <p role="status" className="arrive mt-4 rounded-2xl bg-sand px-4 py-3 font-medium text-ink">
                This session has ended. New questions and votes are closed.
              </p>
            )}
            <p role="alert" className="mt-3 min-h-5 text-sm font-medium text-sand">
              {message}
            </p>

            {summary && (
              <div className="arrive mt-4 rounded-[1.5rem] border border-sage/40 bg-sage/30 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-3xl">Summary</h2>
                  <div className="flex gap-2">
                    <Button variant="ghostDark" size="sm" onClick={copySummary}>
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button variant="ghostDark" size="sm" onClick={() => setSummary("")}>
                      Close
                    </Button>
                  </div>
                </div>
                <pre className="mt-3 whitespace-pre-wrap font-sans text-base leading-relaxed">{summary}</pre>
              </div>
            )}

            {questions.length === 0 ? (
              <div className="mt-12 flex items-center gap-4">
                <div className="flex items-center gap-1.5 rounded-full bg-paper/[0.08] px-5 py-3" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2.5 w-2.5 animate-bounce rounded-full bg-sand"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
                <p className="max-w-[34ch] font-display text-3xl text-paper/85">
                  Waiting for the first question
                </p>
              </div>
            ) : (
              <div ref={listRef} className="relative">
                {groups.map(([label, items]) => (
                  <div key={label} className="mt-9">
                    <h2 className="flex items-center gap-3 font-display text-3xl text-sand">
                      <svg width="14" height="12" viewBox="0 0 28 24" aria-hidden="true">
                        <polygon points="7,0 21,0 28,12 21,24 7,24 0,12" fill="currentColor" />
                      </svg>
                      {label}
                    </h2>
                    <ul className="mt-3 space-y-3">
                      {items.map((q) => {
                        const sentReplies = repliesByQuestion[q.id] || [];
                        return (
                          <li
                            key={q.id}
                            data-flip-id={q.id}
                            className={`rounded-[1.5rem] border p-4 transition-colors duration-300 sm:p-5 ${
                              q.status === "pinned"
                                ? "border-sand bg-sand/20"
                                : "border-paper/10 bg-paper/[0.06] hover:bg-paper/[0.11]"
                            } ${fresh.has(q.id) ? "arrive" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex min-w-0 gap-3">
                                <HexIcon size={38} tone="dark">
                                  <span className="font-mono text-xs font-semibold">{initial(q.authorName)}</span>
                                </HexIcon>
                                <div className="min-w-0">
                                  <p className="text-sm text-paper/70">{q.authorName || "Anonymous"}</p>
                                  <p
                                    className={`break-words text-xl leading-snug sm:text-2xl ${
                                      q.status === "answered" ? "text-paper/55 line-through" : ""
                                    }`}
                                  >
                                    {q.text}
                                  </p>
                                </div>
                              </div>
                              <span
                                className="shrink-0 rounded-full bg-paper px-3.5 py-1.5 font-mono font-semibold text-ink"
                                aria-label={`${q.upvoteCount} votes`}
                              >
                                <span key={q.upvoteCount} className="pop">
                                  {q.upvoteCount}
                                </span>
                              </span>
                            </div>

                            {isPresenter && (
                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                <Button variant="sand" size="sm" onClick={() => setReplyTo(q.id)}>
                                  {sentReplies.length > 0 ? "Reply again" : "Reply privately"}
                                </Button>
                                <Button
                                  variant="ghostDark"
                                  size="sm"
                                  onClick={() => setStatus(q.id, q.status === "pinned" ? "visible" : "pinned")}
                                >
                                  {q.status === "pinned" ? "Unpin" : "Pin"}
                                </Button>
                                <Button
                                  variant="ghostDark"
                                  size="sm"
                                  onClick={() => setStatus(q.id, q.status === "answered" ? "visible" : "answered")}
                                >
                                  {q.status === "answered" ? "Mark unanswered" : "Mark answered"}
                                </Button>
                                <Button variant="ghostDark" size="sm" onClick={() => setStatus(q.id, "hidden")}>
                                  Hide
                                </Button>
                                {sentReplies.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setReplyTo(q.id)}
                                    className="ml-auto flex items-center gap-1.5 rounded-full bg-sage/35 px-3 py-1 text-sm transition-colors hover:bg-sage/55"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                      <rect x="3" y="7" width="10" height="7" rx="2" />
                                      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" strokeLinecap="round" />
                                    </svg>
                                    Replied privately ({sentReplies.length})
                                  </button>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {isPresenter && (
        <ReplyDrawer
          open={Boolean(activeQuestion)}
          question={activeQuestion}
          presenterToken={token}
          previous={activeQuestion ? repliesByQuestion[activeQuestion.id] : []}
          onClose={closeReply}
          onSent={handleSent}
        />
      )}
    </main>
  );
}

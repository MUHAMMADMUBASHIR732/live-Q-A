"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import LiveDot from "@/components/LiveDot";
import ReplyDrawer from "@/components/ReplyDrawer";
import { useRoom } from "@/hooks/useRoom";
import { useFlip } from "@/hooks/useFlip";
import { useFreshIds } from "@/hooks/useFreshIds";
import { sortQuestions } from "@/lib/sort";

const OTHER = "Other questions";

const time = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function PresenterBoard({ id }) {
  const { session, questions, status, closed, patch, setSessionStatus, seed } = useRoom({
    sessionId: id,
  });
  const [token, setToken] = useState(null);
  const [origin, setOrigin] = useState("");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [repliesByQuestion, setRepliesByQuestion] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const fresh = useFreshIds(questions);
  const listRef = useFlip(questions);

  useEffect(() => {
    setToken(localStorage.getItem(`presenter:${id}`));
    // The session was just created in this browser: show its title and code immediately.
    try {
      const saved = sessionStorage.getItem(`session:${id}`);
      if (saved) seed(JSON.parse(saved));
    } catch {
      /* the first load will fill it in */
    }
    // Use the configured public address, unless it is localhost (phones cannot open that).
    const configured = process.env.NEXT_PUBLIC_APP_URL;
    setOrigin(configured && !configured.includes("localhost") ? configured : window.location.origin);
  }, [id, seed]);

  // The presenter's own record of private replies already sent.
  const loadReplies = useCallback(
    async (presenterToken) => {
      try {
        const res = await fetch(`/api/sessions/${id}/replies`, {
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
    [id]
  );

  useEffect(() => {
    if (token) loadReplies(token);
  }, [token, loadReplies]);

  const isPresenter = Boolean(token);
  const joinUrl = session ? `${origin}/join/${session.joinCode}` : "";
  const totalVotes = questions.reduce((sum, q) => sum + q.upvoteCount, 0);
  const repliedCount = Object.keys(repliesByQuestion).length;

  // Group by topic. Topics with the most votes come first.
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

  async function setStatus(qid, next) {
    setMessage("");
    patch({ id: qid, status: next }); // change it on screen straight away
    const res = await fetch(`/api/questions/${qid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, presenterToken: token, sessionId: id }),
    });
    if (!res.ok) setMessage("That action was not allowed. Use the browser where you created the session.");
  }

  async function toggleSession() {
    setMessage("");
    const next = closed ? "open" : "closed";
    setSessionStatus(next);
    const res = await fetch(`/api/sessions/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, presenterToken: token }),
    });
    if (!res.ok) {
      setSessionStatus(closed ? "closed" : "open");
      setMessage("That action was not allowed. Use the browser where you created the session.");
    }
  }

  async function makeSummary() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/sessions/${id}/summary`, {
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

  function handleSent(reply, patchObj) {
    setRepliesByQuestion((prev) => ({
      ...prev,
      [reply.questionId]: [reply, ...(prev[reply.questionId] || [])],
    }));
    if (patchObj) patch(patchObj);
  }

  const closeReply = useCallback(() => setReplyTo(null), []);
  const activeQuestion = replyTo ? questions.find((q) => q.id === replyTo) || null : null;

  if (status === "missing") {
    return (
      <main className="min-h-dvh bg-ink px-5 py-10 text-paper">
        <div className="mx-auto max-w-xl">
          <Link href="/" aria-label="Hexa AskBoard home">
            <Logo />
          </Link>
          <h1 className="mt-10 text-5xl font-bold leading-[0.95] tracking-tighter">
            This session does not exist
          </h1>
          <p className="mt-4 text-lg text-paper/85">It may have been deleted, or the link is wrong.</p>
          <div className="mt-6">
            <Button href="/create" variant="sand">
              Start a new session
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-ink text-paper">
      <header className="border-b border-paper/25">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-5">
            <Link href="/" aria-label="Hexa AskBoard home">
              <Logo />
            </Link>
            <p className="flex items-center gap-2 text-sm text-paper/85">
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
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-paper/25 p-5 sm:px-8 lg:border-b-0 lg:border-r lg:py-8 lg:pr-6">
          <div className="border-2 border-paper bg-paper p-4 text-ink">
            <div className="mx-auto w-fit">
              {session && origin ? (
                <QRCodeSVG
                  value={joinUrl}
                  size={216}
                  level="M"
                  marginSize={0}
                  bgColor="#E8E2D3"
                  fgColor="#22333B"
                />
              ) : (
                <div className="flex h-[216px] w-[216px] items-center justify-center font-mono text-sm text-ink/70">
                  Loading...
                </div>
              )}
            </div>
            <p className="mt-4 text-center text-sm">Scan to ask a question</p>
            <p className="mt-1 text-center font-mono text-3xl font-medium tracking-[0.2em]">
              {session ? session.joinCode : "------"}
            </p>
            <p className="mt-2 break-all text-center font-mono text-xs text-ink/70">{joinUrl}</p>
          </div>

          <dl className="mt-5 border-t border-paper/25 font-mono text-sm">
            {[
              ["Questions", questions.length],
              ["Votes", totalVotes],
              ["Replied privately", repliedCount],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between border-b border-paper/25 py-2.5">
                <dt className="text-paper/80">{label}</dt>
                <dd className="text-xl font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          {!isPresenter && (
            <p className="mt-5 border border-paper/35 p-3 text-sm text-paper/85">
              You are viewing this board. Moderation and private replies are available in the browser
              where the session was created.
            </p>
          )}
        </aside>

        <section aria-live="polite" className="p-5 sm:px-8 lg:py-8">
          <h1 className="min-h-[3.5rem] text-5xl font-bold leading-[0.95] tracking-tighter sm:text-6xl">
            {session ? session.title : ""}
          </h1>

          {closed && (
            <p role="status" className="mt-4 border-2 border-paper bg-sand p-3 font-semibold text-ink">
              This session has ended. New questions and votes are closed.
            </p>
          )}
          <p role="alert" className="mt-3 min-h-5 text-sm font-semibold text-sand">
            {message}
          </p>

          {summary && (
            <div className="mt-4 border-2 border-paper bg-sage/35 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold tracking-tight">Summary</h2>
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

          {status === "loading" && questions.length === 0 ? (
            <p className="mt-10 font-mono text-sm text-paper/75">Loading questions...</p>
          ) : questions.length === 0 ? (
            <div className="mt-10">
              <p className="text-3xl font-bold tracking-tight">Waiting for the first question</p>
              <p className="mt-1 text-paper/80">Show the code on screen and ask the room to scan it.</p>
            </div>
          ) : (
            <div ref={listRef} className="relative">
              {groups.map(([label, items]) => (
                <div key={label} className="mt-8">
                  <h2 className="flex items-baseline justify-between border-b-2 border-sand pb-1 font-mono text-sm text-sand">
                    <span>{label}</span>
                    <span>{items.length}</span>
                  </h2>
                  <ul>
                    {items.map((q) => {
                      const sent = repliesByQuestion[q.id] || [];
                      return (
                        <li
                          key={q.id}
                          data-flip-id={q.id}
                          className={`grid grid-cols-[3.5rem_1fr] gap-4 border-b border-paper/25 py-4 ${
                            q.status === "pinned" ? "-mx-3 border-l-4 border-l-sand bg-paper/[0.07] px-3" : ""
                          } ${fresh.has(q.id) ? "arrive" : ""}`}
                        >
                          <p className="text-right font-mono text-3xl font-medium leading-none">
                            {q.upvoteCount}
                          </p>
                          <div className="min-w-0">
                            <p
                              className={`break-words text-xl leading-snug sm:text-2xl ${
                                q.status === "answered" ? "text-paper/55 line-through" : ""
                              }`}
                            >
                              {q.text}
                            </p>
                            <p className="mt-1 font-mono text-xs text-paper/70">
                              {q.authorName || "Anonymous"} at {time(q.createdAt)}
                            </p>

                            {isPresenter && (
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Button variant="sand" size="sm" onClick={() => setReplyTo(q.id)}>
                                  {sent.length > 0 ? "Reply again" : "Reply privately"}
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
                                {sent.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setReplyTo(q.id)}
                                    className="font-mono text-xs underline underline-offset-4 hover:text-sand"
                                  >
                                    Replied privately ({sent.length})
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
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

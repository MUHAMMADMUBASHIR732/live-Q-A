"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import LiveDot from "@/components/LiveDot";
import AnimatedNumber from "@/components/AnimatedNumber";
import { useLiveQuestions } from "@/hooks/useLiveQuestions";
import { useFlip } from "@/hooks/useFlip";
import { useFreshIds } from "@/hooks/useFreshIds";
import { sortQuestions } from "@/lib/sort";

const OTHER = "Other questions";

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

  const isPresenter = Boolean(token);
  const joinUrl = `${origin}/join/${session.joinCode}`;
  const totalVotes = questions.reduce((sum, q) => sum + q.upvoteCount, 0);

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

  return (
    <main className="min-h-dvh bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Link href="/" aria-label="Askboard home">
              <Logo />
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

        <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl bg-paper p-5 text-ink transition-transform duration-500 hover:-rotate-1 hover:scale-[1.02]">
              <div className="mx-auto w-fit rounded-xl bg-paper">
                {origin && (
                  <QRCodeSVG
                    value={joinUrl}
                    size={200}
                    level="M"
                    marginSize={1}
                    bgColor="#EFF3F1"
                    fgColor="#22333B"
                  />
                )}
              </div>
              <p className="mt-4 text-center text-sm">Scan to ask a question</p>
              <p className="mt-1 text-center font-display text-4xl font-semibold tracking-[0.18em]">
                {session.joinCode}
              </p>
              <p className="mt-2 break-all text-center text-sm text-ink/75">{joinUrl}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-paper/[0.07] p-4 transition-colors duration-300 hover:bg-paper/[0.12]">
                <dd className="font-display text-3xl font-semibold">
                  <AnimatedNumber value={questions.length} />
                </dd>
                <dt className="text-sm text-paper/75">Questions</dt>
              </div>
              <div className="rounded-2xl bg-paper/[0.07] p-4 transition-colors duration-300 hover:bg-paper/[0.12]">
                <dd className="font-display text-3xl font-semibold">
                  <AnimatedNumber value={totalVotes} />
                </dd>
                <dt className="text-sm text-paper/75">Votes</dt>
              </div>
            </dl>

            {!isPresenter && (
              <p className="rounded-xl bg-paper/[0.07] p-4 text-sm text-paper/80">
                You are viewing this board. Moderation is available in the browser where the
                session was created.
              </p>
            )}
          </aside>

          <section aria-live="polite">
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              {session.title}
            </h1>

            {closed && (
              <p role="status" className="arrive mt-4 rounded-xl bg-sand px-4 py-3 font-medium text-ink">
                This session has ended. New questions and votes are closed.
              </p>
            )}
            <p role="alert" className="mt-3 min-h-5 text-sm font-medium text-sand">
              {message}
            </p>

            {summary && (
              <div className="arrive mt-4 rounded-2xl bg-sage/35 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold">Summary</h2>
                  <div className="flex gap-2">
                    <Button variant="ghostDark" size="sm" onClick={copySummary}>
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button variant="ghostDark" size="sm" onClick={() => setSummary("")}>
                      Close
                    </Button>
                  </div>
                </div>
                <pre className="mt-3 whitespace-pre-wrap font-sans text-base leading-relaxed">
                  {summary}
                </pre>
              </div>
            )}

            {questions.length === 0 ? (
              <div className="mt-10 flex items-center gap-4">
                <div className="flex items-center gap-1.5 rounded-full bg-paper/[0.08] px-5 py-3" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2.5 w-2.5 animate-bounce rounded-full bg-sand"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
                <p className="max-w-[34ch] text-xl text-paper/80">
                  No questions yet. Ask the room to scan the code and send the first one.
                </p>
              </div>
            ) : (
              <div ref={listRef} className="relative">
                {groups.map(([label, items]) => (
                  <div key={label} className="mt-8">
                    <h2 className="font-display text-2xl font-semibold text-sand">{label}</h2>
                    <ul className="mt-3 space-y-3">
                      {items.map((q) => (
                        <li
                          key={q.id}
                          data-flip-id={q.id}
                          className={`rounded-2xl p-4 transition-colors duration-300 sm:p-5 ${
                            q.status === "pinned"
                              ? "bg-sand/20 ring-2 ring-sand"
                              : "bg-paper/[0.07] hover:bg-paper/[0.12]"
                          } ${fresh.has(q.id) ? "arrive" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <p
                              className={`break-words text-xl leading-snug sm:text-2xl ${
                                q.status === "answered" ? "text-paper/55 line-through" : ""
                              }`}
                            >
                              {q.text}
                            </p>
                            <span
                              className="shrink-0 rounded-full bg-paper px-3.5 py-1.5 font-semibold text-ink"
                              aria-label={`${q.upvoteCount} votes`}
                            >
                              <span key={q.upvoteCount} className="pop">
                                {q.upvoteCount}
                              </span>
                            </span>
                          </div>

                          {isPresenter && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button
                                variant="ghostDark"
                                size="sm"
                                onClick={() =>
                                  setStatus(q.id, q.status === "pinned" ? "visible" : "pinned")
                                }
                              >
                                {q.status === "pinned" ? "Unpin" : "Pin"}
                              </Button>
                              <Button
                                variant="ghostDark"
                                size="sm"
                                onClick={() =>
                                  setStatus(q.id, q.status === "answered" ? "visible" : "answered")
                                }
                              >
                                {q.status === "answered" ? "Mark unanswered" : "Mark answered"}
                              </Button>
                              <Button
                                variant="ghostDark"
                                size="sm"
                                onClick={() => setStatus(q.id, "hidden")}
                              >
                                Hide
                              </Button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

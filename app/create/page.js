"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import Warmup from "@/components/Warmup";

export default function CreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create the session.");

      // Only this browser holds the presenter token, so only it can moderate and reply.
      localStorage.setItem(`presenter:${data.id}`, data.presenterToken);
      // Hand the new session to the next page, so it can show the title and QR code at once.
      try {
        sessionStorage.setItem(
          `session:${data.id}`,
          JSON.stringify({ id: data.id, title: title.trim(), joinCode: data.joinCode, status: "open" })
        );
      } catch {
        /* the board will load it from the server instead */
      }
      router.push(`/present/${data.id}`);
    } catch (err) {
      setError(err.message || "Could not create the session. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 py-4 sm:px-8">
      <Warmup />
      <header className="border-b-2 border-ink pb-3">
        <Link href="/" aria-label="Hexa AskBoard home" className="inline-block">
          <Logo />
        </Link>
      </header>

      <div className="grid flex-1 items-start gap-12 py-12 md:grid-cols-[1fr_0.8fr]">
        <div>
          <h1 className="text-6xl font-bold leading-[0.92] tracking-tighter sm:text-7xl">Start a session</h1>
          <p className="mt-5 max-w-[44ch] text-lg">
            Give your event a name. You will get a QR code and a six-character code to show your
            audience.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="title" className="block font-semibold">
                Event title
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Product launch Q&A"
                autoFocus
                className="mt-2 w-full rounded-[3px] border-2 border-ink bg-sheet px-4 py-3 text-lg placeholder:text-ink/55"
              />
            </div>
            <Button type="submit" size="lg" disabled={loading || !title.trim()}>
              {loading ? "Creating..." : "Create session"}
            </Button>
            <p role="alert" className="min-h-6 text-sm font-semibold">
              {error}
            </p>
          </form>
        </div>

        <aside className="border-t-2 border-ink pt-4 md:border-l-2 md:border-t-0 md:pl-8 md:pt-0">
          <h2 className="text-xl font-bold tracking-tight">What happens next</h2>
          <ul className="mt-3 space-y-3">
            <li className="border-b border-ink/40 pb-3">
              Your board opens with a QR code and a join code, ready to show on screen.
            </li>
            <li className="border-b border-ink/40 pb-3">
              People scan the code with their phone camera, or with the scanner on this site.
            </li>
            <li>
              You see questions as they come in, and can reply to anyone privately, even with a file.
            </li>
          </ul>
        </aside>
      </div>
    </main>
  );
}

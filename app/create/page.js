"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import Logo from "@/components/Logo";
import Button from "@/components/Button";

// A tiny stable hash so the preview code changes as you type.
function previewCode(text) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let h = 7;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[h % alphabet.length];
    h = Math.floor(h / alphabet.length) + i * 17 + 3;
  }
  return code;
}

export default function CreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const code = previewCode(title.trim() || "Askboard");

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

      // Only this browser holds the presenter token, so only it can moderate.
      localStorage.setItem(`presenter:${data.id}`, data.presenterToken);
      router.push(`/present/${data.id}`);
    } catch (err) {
      setError(err.message || "Could not create the session. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-6 py-6">
      <header>
        <Link href="/" aria-label="Askboard home" className="inline-block">
          <Logo />
        </Link>
      </header>

      <div className="grid flex-1 items-center gap-12 pb-16 pt-10 md:grid-cols-2">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Start a session
          </h1>
          <p className="mt-3 max-w-[44ch] text-ink/80">
            Name your event. You will get a QR code and a join code to show your audience.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="title" className="block font-medium">
                Event title
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Product launch Q&A"
                autoFocus
                className="mt-2 w-full rounded-xl border border-ink/30 bg-paper px-4 py-3 text-lg transition-[border-color,box-shadow] duration-300 placeholder:text-ink/50 hover:border-ink/60 focus:border-ink focus:shadow-[0_0_0_4px_rgba(94,139,126,0.25)]"
              />
            </div>
            <Button type="submit" size="lg" disabled={loading || !title.trim()}>
              {loading ? "Creating session..." : "Create session"}
            </Button>
            <p role="alert" className="min-h-6 text-sm font-medium text-ink">
              {error}
            </p>
          </form>
        </div>

        {/* Live preview: the title and a sample code update as you type. */}
        <div
          className="rounded-3xl bg-ink p-6 text-paper shadow-[0_24px_60px_-30px_rgba(34,51,59,0.8)] transition-transform duration-500 hover:-translate-y-1 hover:rotate-1 sm:p-8"
          aria-label="Preview of your board"
        >
          <p className="text-sm text-paper/70">Preview</p>
          <p
            className={`mt-2 min-h-[2.5rem] break-words font-display text-3xl font-semibold leading-tight transition-opacity duration-300 ${
              title.trim() ? "opacity-100" : "opacity-50"
            }`}
          >
            {title.trim() || "Your event title"}
          </p>
          <div className="mt-6 flex items-center gap-5">
            <div className="rounded-2xl bg-paper p-2">
              <QRCodeSVG
                value={`https://askboard.example/join/${code}`}
                size={108}
                level="L"
                marginSize={0}
                bgColor="#EFF3F1"
                fgColor="#22333B"
              />
            </div>
            <div>
              <p className="text-sm text-paper/70">Sample join code</p>
              <p className="font-display text-3xl font-semibold tracking-[0.18em] text-sand">
                {code}
              </p>
            </div>
          </div>
          <p className="mt-6 text-sm text-paper/75">
            Your real code and QR code appear as soon as you create the session.
          </p>
        </div>
      </div>
    </main>
  );
}

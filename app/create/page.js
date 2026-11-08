"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import HexGrid from "@/components/HexGrid";

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

  const code = previewCode(title.trim() || "Hexa AskBoard");

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
      router.push(`/present/${data.id}`);
    } catch (err) {
      setError(err.message || "Could not create the session. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-6 py-6">
      <header>
        <Link href="/" aria-label="Hexa AskBoard home" className="inline-block">
          <Logo />
        </Link>
      </header>

      <div className="grid flex-1 items-center gap-14 pb-16 pt-10 md:grid-cols-2">
        <div>
          <h1 className="font-display text-6xl leading-[0.98] sm:text-7xl">Start a session</h1>
          <p className="mt-4 max-w-[44ch] text-lg text-ink/80">
            Name your event. You will get a QR code and a join code to show your audience, and
            you can reply privately to anyone who asks.
          </p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-4">
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
                className="mt-2 w-full rounded-2xl border border-ink/30 bg-paper px-4 py-3.5 text-lg transition-[border-color,box-shadow] duration-300 placeholder:text-ink/50 hover:border-ink/60 focus:border-ink focus:shadow-[0_0_0_4px_rgba(94,139,126,0.25)]"
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
          className="relative overflow-hidden rounded-[2rem] border border-paper/10 bg-ink p-7 text-paper shadow-[0_40px_80px_-40px_rgba(34,51,59,0.9)] transition-transform duration-500 hover:-translate-y-1 hover:rotate-1 sm:p-9"
          aria-label="Preview of your board"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 text-paper/[0.07]"
            style={{
              maskImage: "radial-gradient(80% 80% at 100% 0%, black, transparent 80%)",
              WebkitMaskImage: "radial-gradient(80% 80% at 100% 0%, black, transparent 80%)",
            }}
          >
            <HexGrid id="create-hex" size={26} />
          </div>
          <div className="relative">
            <p className="font-mono text-xs text-paper/65">Preview</p>
            <p
              className={`mt-3 min-h-[3.4rem] break-words font-display text-4xl leading-[1.05] transition-opacity duration-300 ${
                title.trim() ? "opacity-100" : "opacity-50"
              }`}
            >
              {title.trim() || "Your event title"}
            </p>
            <div className="mt-8 flex items-center gap-5">
              <div className="rounded-2xl bg-paper p-2.5">
                <QRCodeSVG
                  value={`https://hexa-askboard.example/join/${code}`}
                  size={108}
                  level="L"
                  marginSize={0}
                  bgColor="#EFF3F1"
                  fgColor="#22333B"
                />
              </div>
              <div>
                <p className="text-sm text-paper/70">Sample join code</p>
                <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.2em] text-sand">{code}</p>
              </div>
            </div>
            <p className="mt-8 text-sm text-paper/75">
              Your real code and QR code appear as soon as you create the session.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

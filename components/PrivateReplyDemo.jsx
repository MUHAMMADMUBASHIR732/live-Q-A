"use client";

import { useEffect, useState } from "react";
import FileBadge from "@/components/FileBadge";

const CYCLE = 7; // four steps, then a short hold on the finished picture

// A looping picture of the private reply: you write, one phone gets it, the rest see nothing.
export default function PrivateReplyDemo() {
  const [tick, setTick] = useState(3); // the server renders the finished picture
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setTick(0);
    const timer = setInterval(() => setTick((t) => (t + 1) % CYCLE), 1800);
    return () => clearInterval(timer);
  }, []);
  const step = Math.min(tick, 3);

  const panel = "border-2 border-ink bg-sheet p-4";

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div>
        <div className={`${panel} h-full`}>
          <p className="font-mono text-xs text-ink/75">What you see</p>
          <div className="mt-3 border-l-4 border-pine bg-paper px-3 py-2">
            <p className="font-mono text-xs text-ink/75">Sara asked</p>
            <p className="leading-snug">Can you share the pricing sheet?</p>
          </div>
          <div className="mt-3 border-2 border-ink p-3">
            <p>Sure. Here is the latest sheet.</p>
            <div className={`mt-3 transition-opacity duration-300 ${step >= 1 ? "opacity-100" : "opacity-0"}`}>
              <FileBadge name="pricing-sheet.pdf" size={245760} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <span
              className={`border-2 border-ink px-3 py-1.5 text-sm font-semibold transition-colors duration-300 ${
                step >= 2 ? "bg-pine text-paper" : "bg-sand"
              }`}
            >
              {step >= 2 ? "Sent privately" : "Send privately"}
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm">You write, attach a file, and send it.</p>
      </div>

      <div>
        <div className={`${panel} h-full`}>
          <p className="font-mono text-xs text-ink/75">What Sara sees on her phone</p>
          <div className="mt-3 min-h-[240px] border-2 border-ink bg-paper p-3">
            <p className="font-mono text-[11px] text-ink/75">Live, code K7M2QX</p>
            {step >= 3 ? (
              <div key="reply" className="arrive mt-3 border-2 border-ink bg-sand p-3">
                <p className="font-bold tracking-tight">Private from the presenter</p>
                <p className="mt-1 text-sm leading-snug">Sure. Here is the latest sheet.</p>
                <div className="mt-2">
                  <FileBadge name="pricing-sheet.pdf" size={245760} />
                </div>
              </div>
            ) : (
              <p className="mt-12 text-center font-mono text-sm text-ink/70">Waiting for a reply...</p>
            )}
          </div>
        </div>
        <p className="mt-3 text-sm">It shows up on the phone she asked from.</p>
      </div>

      <div>
        <div className={`${panel} h-full`}>
          <p className="font-mono text-xs text-ink/75">What everyone else sees</p>
          <div className="mt-3 min-h-[240px] border-2 border-ink bg-paper p-3">
            <p className="font-mono text-[11px] text-ink/75">Live, code K7M2QX</p>
            <ul className="mt-3">
              {[
                ["Can you share the pricing sheet?", 12],
                ["Is there a student plan?", 9],
              ].map(([q, n]) => (
                <li key={q} className="grid grid-cols-[2rem_1fr] gap-2 border-b border-ink/30 py-2 text-sm">
                  <span className="text-right font-mono font-medium">{n}</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center font-mono text-sm text-ink/70">Nothing else. No reply, no sign of one.</p>
          </div>
        </div>
        <p className="mt-3 text-sm">Everyone else sees the question and nothing more.</p>
      </div>
    </div>
  );
}

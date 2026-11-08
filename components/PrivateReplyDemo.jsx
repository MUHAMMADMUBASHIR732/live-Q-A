"use client";

import { useEffect, useState } from "react";
import HexIcon from "@/components/HexIcon";
import FileBadge from "@/components/FileBadge";

const CYCLE = 7; // four animated steps, then a short hold on the finished state

function Lock({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="2" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" strokeLinecap="round" />
    </svg>
  );
}

// A looping picture of the private reply flow: the presenter replies, one phone receives it,
// and everyone else sees nothing.
export default function PrivateReplyDemo() {
  const [tick, setTick] = useState(3); // server render shows the finished state
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setTick(0);
    const timer = setInterval(() => setTick((t) => (t + 1) % CYCLE), 1800);
    return () => clearInterval(timer);
  }, []);
  const step = Math.min(tick, 3);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* The presenter */}
      <div>
        <div className="h-full rounded-[1.75rem] border border-paper/15 bg-paper/[0.05] p-5">
          <p className="font-mono text-xs text-paper/60">You, the presenter</p>
          <div className="mt-3 rounded-2xl border border-paper/10 bg-paper/[0.05] p-3">
            <p className="text-xs text-paper/60">Sara asked</p>
            <p className="mt-0.5 leading-snug">Can you share the pricing sheet?</p>
          </div>
          <div className="mt-3 rounded-2xl border border-paper/25 p-3">
            <p className="text-paper/90">Sure. Here is the latest sheet.</p>
            <div
              className={`mt-3 transition-all duration-500 ${
                step >= 1 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              }`}
            >
              <FileBadge name="pricing-sheet.pdf" size={245760} dark />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-500 ${
                step >= 2 ? "bg-paper text-ink" : "bg-sand text-ink"
              }`}
            >
              {step >= 2 ? "Sent privately" : "Send privately"}
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm text-paper/75">The presenter writes and attaches a file.</p>
      </div>

      {/* The person who asked */}
      <div>
        <div className="h-full rounded-[1.75rem] border border-paper/15 bg-paper/[0.05] p-5">
          <p className="font-mono text-xs text-paper/60">Sara&apos;s phone</p>
          <div className="mx-auto mt-3 min-h-[250px] rounded-[1.6rem] border-2 border-paper/20 p-3">
            <p className="flex items-center gap-2 font-mono text-[11px] text-paper/60">
              <span className="h-1.5 w-1.5 rounded-full bg-sand" />
              Live K7M2QX
            </p>
            {step >= 3 ? (
              <div key="reply" className="arrive mt-3 rounded-2xl border border-sand/70 bg-sand/15 p-3">
                <div className="flex items-center gap-2">
                  <HexIcon size={28} tone="sand">
                    <Lock size={12} />
                  </HexIcon>
                  <p className="font-display text-lg leading-none">Private from the presenter</p>
                </div>
                <p className="mt-2 text-sm leading-snug">Sure. Here is the latest sheet.</p>
                <div className="mt-2">
                  <FileBadge name="pricing-sheet.pdf" size={245760} dark />
                </div>
              </div>
            ) : (
              <div key="wait" className="mt-10 flex flex-col items-center text-center text-paper/60">
                <div className="flex gap-1.5" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 animate-bounce rounded-full bg-sand/70"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
                <p className="mt-3 text-sm">Waiting for a reply</p>
              </div>
            )}
          </div>
        </div>
        <p className="mt-3 text-sm text-paper/75">Sara receives it on the phone she asked from.</p>
      </div>

      {/* Everyone else */}
      <div>
        <div className="h-full rounded-[1.75rem] border border-paper/15 bg-paper/[0.05] p-5">
          <p className="font-mono text-xs text-paper/60">Everyone else</p>
          <div className="mx-auto mt-3 min-h-[250px] rounded-[1.6rem] border-2 border-paper/20 p-3">
            <p className="flex items-center gap-2 font-mono text-[11px] text-paper/60">
              <span className="h-1.5 w-1.5 rounded-full bg-sand" />
              Live K7M2QX
            </p>
            <ul className="mt-3 space-y-2">
              {[
                ["Can you share the pricing sheet?", 12],
                ["Is there a student plan?", 9],
              ].map(([q, n]) => (
                <li key={q} className="flex items-center justify-between gap-3 rounded-xl bg-paper/[0.07] px-3 py-2 text-sm">
                  <span>{q}</span>
                  <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-xs font-semibold text-ink">{n}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-paper/60">
              <Lock size={14} />
              No reply shown. It is private.
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-paper/75">Everyone else sees nothing at all.</p>
      </div>
    </div>
  );
}

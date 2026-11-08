"use client";

import { useEffect, useRef, useState } from "react";
import { useFlip } from "@/hooks/useFlip";
import HexGrid from "@/components/HexGrid";

const INITIAL = [
  {
    topic: "Pricing",
    items: [
      { id: "p1", text: "Is there a student plan?", votes: 24 },
      { id: "p2", text: "Can we pay yearly instead of monthly?", votes: 11 },
    ],
  },
  {
    topic: "Integrations",
    items: [
      { id: "i1", text: "Does it work with Slack?", votes: 17 },
      { id: "i2", text: "Can I export questions to a spreadsheet?", votes: 9 },
    ],
  },
];

const fresh = () => INITIAL.map((g) => ({ ...g, items: g.items.map((i) => ({ ...i })) }));

// A self-playing sample board: votes tick up, rows re-order, and a spam message is hidden.
export default function DemoBoard() {
  const [groups, setGroups] = useState(fresh);
  const [spam, setSpam] = useState("none"); // none | in | hidden
  const [hiddenCount, setHiddenCount] = useState(1);
  const cardRef = useRef(null);
  const listRef = useFlip(groups);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // New votes arrive every moment.
    const votes = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const g = Math.floor(Math.random() * INITIAL.length);
      const i = Math.floor(Math.random() * INITIAL[g].items.length);
      setGroups((prev) => {
        const top = Math.max(...prev.flatMap((x) => x.items.map((it) => it.votes)));
        if (top > 60) return fresh(); // start over so the numbers stay small
        return prev.map((group, gi) =>
          gi !== g
            ? group
            : {
                ...group,
                items: group.items.map((it, ii) => (ii === i ? { ...it, votes: it.votes + 1 } : it)),
              }
        );
      });
    }, 1700);

    // Every few seconds a spam message arrives and is hidden automatically.
    let t1, t2;
    function spamCycle() {
      setSpam("in");
      t1 = setTimeout(() => setSpam("hidden"), 1800);
      t2 = setTimeout(() => {
        setSpam("none");
        setHiddenCount((c) => c + 1);
      }, 2700);
    }
    const first = setTimeout(spamCycle, 4000);
    const spamTimer = setInterval(spamCycle, 9500);

    return () => {
      clearInterval(votes);
      clearInterval(spamTimer);
      clearTimeout(first);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  function trackPointer(e) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  const maxVotes = Math.max(...groups.flatMap((g) => g.items.map((i) => i.votes)));
  let rowIndex = 0;

  return (
    <div
      ref={cardRef}
      onMouseMove={trackPointer}
      className="group relative overflow-hidden rounded-[1.75rem] border border-paper/10 bg-ink p-5 text-paper shadow-[0_40px_80px_-40px_rgba(34,51,59,0.9)] transition-transform duration-500 hover:-translate-y-1 sm:p-7"
      aria-label="Sample presenter board"
    >
      {/* A soft sand spotlight follows the pointer. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(360px circle at var(--mx, 50%) var(--my, 0%), rgba(199,161,122,0.18), transparent 65%)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 text-paper/[0.06]"
        style={{
          maskImage: "radial-gradient(70% 70% at 100% 0%, black, transparent 80%)",
          WebkitMaskImage: "radial-gradient(70% 70% at 100% 0%, black, transparent 80%)",
        }}
      >
        <HexGrid id="demo-hex" size={24} />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between gap-4 border-b border-paper/15 pb-4">
          <p className="font-display text-2xl">Product launch Q&amp;A</p>
          <p className="rounded-md bg-sand px-2.5 py-1 font-mono text-sm font-semibold text-ink">
            K7M2QX
          </p>
        </div>

        <div ref={listRef} className="relative">
          {groups.map((group) => {
            const sorted = [...group.items].sort((a, b) => b.votes - a.votes);
            return (
              <div key={group.topic} className="mt-5">
                <p className="font-display text-xl text-sand">{group.topic}</p>
                <ul className="mt-2 space-y-2">
                  {sorted.map((item) => {
                    const i = rowIndex++;
                    return (
                      <li
                        key={item.id}
                        data-flip-id={item.id}
                        style={{ "--i": i }}
                        className="settle relative overflow-hidden rounded-2xl bg-paper/[0.07] transition-colors duration-300 hover:bg-paper/[0.13]"
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0 bg-sage/30 transition-[width] duration-700 ease-out"
                          style={{ width: `${(item.votes / maxVotes) * 100}%` }}
                        />
                        <div className="relative flex items-center justify-between gap-4 px-4 py-3">
                          <span>{item.text}</span>
                          <span className="rounded-full bg-paper px-3 py-1 text-sm font-semibold text-ink">
                            <span key={item.votes} className="pop">
                              {item.votes}
                            </span>
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* A spam message slides in, gets hidden, and folds away. */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
            spam === "in" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-dashed border-sand/70 px-4 py-3">
              <span className="text-paper/80">BUY NOW cheap watches https://spam.example</span>
              <span className="shrink-0 rounded-md bg-sand px-2 py-0.5 text-sm font-semibold text-ink">
                Spam
              </span>
            </div>
          </div>
        </div>

        <p className="mt-5 rounded-xl bg-sage/35 px-4 py-2.5 text-sm">
          <span key={hiddenCount} className="pop font-semibold">
            {hiddenCount}
          </span>{" "}
          spam {hiddenCount === 1 ? "message was" : "messages were"} hidden automatically.
        </p>
      </div>
    </div>
  );
}

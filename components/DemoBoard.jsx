"use client";

import { useEffect, useState } from "react";
import { useFlip } from "@/hooks/useFlip";

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

// A sample board that plays by itself: votes come in, rows change places, and spam gets stamped.
export default function DemoBoard() {
  const [groups, setGroups] = useState(fresh);
  const [spam, setSpam] = useState("none"); // none | in | hidden
  const [hiddenCount, setHiddenCount] = useState(1);
  const listRef = useFlip(groups);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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

    let t1, t2;
    function spamCycle() {
      setSpam("in");
      t1 = setTimeout(() => setSpam("hidden"), 1800);
      t2 = setTimeout(() => {
        setSpam("none");
        setHiddenCount((c) => c + 1);
      }, 2900);
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

  const maxVotes = Math.max(...groups.flatMap((g) => g.items.map((i) => i.votes)));

  return (
    <div className="border-2 border-ink bg-sheet shadow-[6px_6px_0_0_#22333b]" aria-label="Sample presenter board">
      <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink px-4 py-3">
        <p className="text-lg font-bold tracking-tight">Product launch Q&amp;A</p>
        <p className="font-mono text-sm font-medium tracking-widest">K7M2QX</p>
      </div>

      <div ref={listRef} className="relative">
        {groups.map((group) => {
          const sorted = [...group.items].sort((a, b) => b.votes - a.votes);
          return (
            <div key={group.topic}>
              <p className="bg-ink px-4 py-1 font-mono text-xs text-paper">{group.topic}</p>
              <ul>
                {sorted.map((item) => (
                  <li
                    key={item.id}
                    data-flip-id={item.id}
                    className="relative grid grid-cols-[2.5rem_1fr] items-baseline gap-3 border-b border-ink/30 px-4 py-3"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 bg-sage/35 transition-[width] duration-700 ease-out"
                      style={{ width: `${(item.votes / maxVotes) * 100}%` }}
                    />
                    <span className="relative text-right font-mono text-lg font-medium">{item.votes}</span>
                    <span className="relative">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          spam === "none" ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="relative grid grid-cols-[2.5rem_1fr] items-baseline gap-3 border-b border-ink/30 px-4 py-3">
            <span className="text-right font-mono text-lg font-medium">1</span>
            <span className={spam === "hidden" ? "text-ink/50 line-through" : ""}>
              BUY NOW cheap watches https://spam.example
            </span>
            {spam === "hidden" && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 -rotate-6 border-2 border-pine bg-sheet px-2 py-0.5 font-mono text-xs font-medium text-pine">
                hidden
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="px-4 py-3 font-mono text-xs text-ink/75">
        {hiddenCount} spam {hiddenCount === 1 ? "message" : "messages"} hidden automatically
      </p>
    </div>
  );
}

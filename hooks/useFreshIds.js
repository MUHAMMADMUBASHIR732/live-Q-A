"use client";

import { useEffect, useRef, useState } from "react";

// Returns the ids of questions that arrived after the first render, for a short time,
// so the UI can highlight them.
export function useFreshIds(questions, durationMs = 1400) {
  const seen = useRef(null);
  const timers = useRef([]);
  const [fresh, setFresh] = useState(() => new Set());

  useEffect(() => {
    const ids = questions.map((q) => q.id);

    if (seen.current === null) {
      seen.current = new Set(ids); // first render: nothing counts as new
      return;
    }

    const added = ids.filter((id) => !seen.current.has(id));
    ids.forEach((id) => seen.current.add(id));
    if (added.length === 0) return;

    setFresh((prev) => new Set([...prev, ...added]));
    const timer = setTimeout(() => {
      setFresh((prev) => {
        const next = new Set(prev);
        added.forEach((id) => next.delete(id));
        return next;
      });
    }, durationMs);
    timers.current.push(timer);
  }, [questions, durationMs]);

  // Clear pending timers only when the component goes away.
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return fresh;
}

"use client";

import { useEffect, useRef, useState } from "react";

// Counts smoothly from the old number to the new one.
export default function AnimatedNumber({ value, className = "" }) {
  const [display, setDisplay] = useState(value);
  const current = useRef(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = value;
      setDisplay(value);
      return;
    }

    const startValue = current.current;
    const start = performance.now();
    const duration = 450;
    let frame;

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(startValue + (value - startValue) * eased);
      current.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className={className}>{display}</span>;
}

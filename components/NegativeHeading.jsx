"use client";

import { useEffect, useRef, useState } from "react";

// Heading with a line-by-line "negative mask" reveal. Hover it to replay the animation.
export default function NegativeHeading({ lines, className = "" }) {
  const [run, setRun] = useState(0);
  const ready = useRef(false);
  const timer = useRef(null);

  function allowReplayLater() {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      ready.current = true;
    }, 2800);
  }

  // The first run takes about 2.5 seconds. After that the heading can be replayed.
  useEffect(() => {
    allowReplayLater();
    return () => clearTimeout(timer.current);
  }, []);

  function replay() {
    if (!ready.current) return;
    ready.current = false;
    setRun((n) => n + 1);
    allowReplayLater();
  }

  return (
    <h1 className={className} aria-label={lines.join(" ")} onMouseEnter={replay}>
      {lines.map((line, i) => (
        <span key={`${run}-${i}`} className="neg-line" style={{ "--i": i }} aria-hidden="true">
          <span className="neg-base block">{line}</span>
          <span className="neg-block block" aria-hidden="true">
            {line}
          </span>
        </span>
      ))}
    </h1>
  );
}

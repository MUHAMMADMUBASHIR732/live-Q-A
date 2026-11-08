"use client";

import { useRef } from "react";

// A card with a soft sand light that follows the pointer.
export default function SpotlightCard({ children, className = "", dark = false }) {
  const ref = useRef(null);

  function onMove(e) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`group relative overflow-hidden rounded-[1.75rem] border transition-[transform,border-color,box-shadow] duration-500 hover:-translate-y-1 ${
        dark
          ? "border-paper/10 bg-ink text-paper hover:border-sand/50 hover:shadow-[0_40px_80px_-40px_rgba(34,51,59,0.9)]"
          : "border-ink/10 bg-ink/[0.03] hover:border-ink/30 hover:shadow-[0_40px_70px_-45px_rgba(34,51,59,0.7)]"
      } ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(340px circle at var(--mx, 50%) var(--my, 0%), ${
            dark ? "rgba(199,161,122,0.16)" : "rgba(199,161,122,0.24)"
          }, transparent 70%)`,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

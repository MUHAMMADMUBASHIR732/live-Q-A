"use client";

import { useLayoutEffect, useRef } from "react";

// Smoothly slides list items to their new position when the order changes (FLIP technique).
// Put the returned ref on a `relative` container, and `data-flip-id` on each item.
export function useFlip(dependency) {
  const containerRef = useRef(null);
  const previous = useRef(new Map());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = container.querySelectorAll("[data-flip-id]");
    const next = new Map();
    nodes.forEach((node) => next.set(node.dataset.flipId, node.offsetTop));

    if (!reduce) {
      nodes.forEach((node) => {
        const before = previous.current.get(node.dataset.flipId);
        if (before === undefined) return; // new item: it has its own entrance animation
        const delta = before - next.get(node.dataset.flipId);
        if (Math.abs(delta) < 1) return;
        node.animate(
          [{ transform: `translateY(${delta}px)` }, { transform: "none" }],
          { duration: 380, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" }
        );
      });
    }
    previous.current = next;
  }, [dependency]);

  return containerRef;
}

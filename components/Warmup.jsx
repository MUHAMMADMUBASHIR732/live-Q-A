"use client";

import { useEffect } from "react";

// Quietly wakes the database and the server function while the visitor is still reading,
// so the first real action (start a session, send a question) is not the slow one.
export default function Warmup() {
  useEffect(() => {
    try {
      const last = Number(sessionStorage.getItem("warmedAt") || 0);
      if (Date.now() - last < 4 * 60 * 1000) return;
      sessionStorage.setItem("warmedAt", String(Date.now()));
    } catch {
      /* storage can be blocked, warm anyway */
    }
    fetch("/api/warm", { cache: "no-store" }).catch(() => {});
  }, []);
  return null;
}

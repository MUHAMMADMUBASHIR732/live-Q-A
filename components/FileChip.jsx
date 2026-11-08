"use client";

import { useState } from "react";
import FileBadge from "@/components/FileBadge";
import { downloadFile } from "@/lib/download";

// A private file with a download button. `tokens` is { voterToken } or { presenterToken }.
export default function FileChip({ file, tokens, dark = false }) {
  const [state, setState] = useState("idle"); // idle | loading | error

  async function handleDownload() {
    setState("loading");
    try {
      await downloadFile(file, tokens);
      setState("idle");
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  return (
    <FileBadge name={file.name} size={file.size} mimeType={file.mimeType} dark={dark}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={state === "loading"}
        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
          dark
            ? "border-paper/30 hover:bg-paper hover:text-ink"
            : "border-ink/30 hover:bg-ink hover:text-paper"
        }`}
      >
        {state === "loading" ? "Preparing..." : state === "error" ? "Failed, retry" : "Download"}
      </button>
    </FileBadge>
  );
}

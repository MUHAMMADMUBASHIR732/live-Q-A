import { fileKind, formatBytes } from "@/lib/files";

const LABEL = {
  image: "IMG",
  pdf: "PDF",
  doc: "DOC",
  sheet: "XLS",
  slides: "PPT",
  archive: "ZIP",
  video: "VID",
  audio: "AUD",
  file: "FILE",
};

// A file row: the type in a box, the name, the size, and a slot for an action.
export default function FileBadge({ name, size, mimeType = "", dark = false, children }) {
  const kind = fileKind(name, mimeType);
  return (
    <div
      className={`flex items-center gap-3 border px-3 py-2 ${
        dark ? "border-paper/35" : "border-ink/50 bg-sheet"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center border font-mono text-[11px] font-medium ${
          dark ? "border-paper/60" : "border-ink"
        }`}
      >
        {LABEL[kind]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className={`font-mono text-xs ${dark ? "text-paper/70" : "text-ink/70"}`}>{formatBytes(size)}</p>
      </div>
      {children}
    </div>
  );
}

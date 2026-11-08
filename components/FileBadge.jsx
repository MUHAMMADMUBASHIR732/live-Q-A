import HexIcon from "@/components/HexIcon";
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

// A file row: hexagon with the file type, the name, the size, and a slot for an action.
export default function FileBadge({ name, size, mimeType = "", dark = false, children }) {
  const kind = fileKind(name, mimeType);
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${
        dark ? "border-paper/15 bg-paper/[0.06]" : "border-ink/15 bg-ink/[0.04]"
      }`}
    >
      <HexIcon size={42} tone={dark ? "dark" : "sage"}>
        <span className="font-mono text-[10px] font-semibold">{LABEL[kind]}</span>
      </HexIcon>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className={`font-mono text-xs ${dark ? "text-paper/65" : "text-ink/65"}`}>
          {formatBytes(size)}
        </p>
      </div>
      {children}
    </div>
  );
}

// Shared by the server (validation) and the browser (labels and sizes).

export const MAX_FILES = 3;
// Kept under Vercel's 4.5 MB request limit for one upload.
export const MAX_TOTAL_BYTES = 4_000_000;
export const MAX_TEXT = 2000;

// Strip folders and unsafe characters from an uploaded file name.
export function sanitizeFileName(name) {
  const base = String(name || "file").split(/[\\/]/).pop();
  const clean = base.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "").trim().slice(0, 120);
  return clean || "file";
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileKind(name, mime = "") {
  const ext = (String(name).split(".").pop() || "").toLowerCase();
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx", "txt", "md", "rtf", "odt"].includes(ext)) return "doc";
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return "sheet";
  if (["ppt", "pptx", "key", "odp"].includes(ext)) return "slides";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  if (mime.startsWith("video/") || ["mp4", "mov", "webm", "mkv"].includes(ext)) return "video";
  if (mime.startsWith("audio/") || ["mp3", "wav", "m4a", "ogg"].includes(ext)) return "audio";
  return "file";
}

// Always download, never display: a file sent to someone must not run inside our site.
export function contentDisposition(name) {
  const ascii = name.replace(/[^A-Za-z0-9._-]/g, "_");
  const encoded = encodeURIComponent(name).replace(
    /['()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

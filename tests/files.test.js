import { describe, it, expect } from "vitest";
import { sanitizeFileName, formatBytes, fileKind, contentDisposition } from "../lib/files.js";

describe("sanitizeFileName", () => {
  it("removes folders", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName("C:\\Users\\me\\report.pdf")).toBe("report.pdf");
  });

  it("removes control and unsafe characters", () => {
    expect(sanitizeFileName('a<b>:"c|d?.txt')).toBe("abcd.txt");
  });

  it("falls back to a default name", () => {
    expect(sanitizeFileName("")).toBe("file");
    expect(sanitizeFileName(null)).toBe("file");
  });

  it("limits the length", () => {
    expect(sanitizeFileName("x".repeat(500)).length).toBe(120);
  });
});

describe("formatBytes", () => {
  it("formats sizes", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});

describe("fileKind", () => {
  it("detects common types", () => {
    expect(fileKind("a.PDF")).toBe("pdf");
    expect(fileKind("a.xlsx")).toBe("sheet");
    expect(fileKind("a.zip")).toBe("archive");
    expect(fileKind("photo", "image/png")).toBe("image");
    expect(fileKind("mystery.bin")).toBe("file");
  });
});

describe("contentDisposition", () => {
  it("is always an attachment with a safe fallback name", () => {
    const header = contentDisposition("my file (1).pdf");
    expect(header.startsWith("attachment;")).toBe(true);
    expect(header).toContain('filename="my_file__1_.pdf"');
    expect(header).toContain("filename*=UTF-8''my%20file%20%281%29.pdf");
  });
});

import { describe, it, expect } from "vitest";
import { codeFromScan } from "../lib/joinCode.js";

describe("codeFromScan", () => {
  it("reads the code from a join link on any address", () => {
    expect(codeFromScan("https://hexa-askboard.vercel.app/join/K7M2QX")).toBe("K7M2QX");
    expect(codeFromScan("http://192.168.1.20:3000/join/k7m2qx/")).toBe("K7M2QX");
  });

  it("accepts the bare six characters", () => {
    expect(codeFromScan("  k7m2qx ")).toBe("K7M2QX");
  });

  it("rejects anything else", () => {
    expect(codeFromScan("https://example.com/other")).toBeNull();
    expect(codeFromScan("hello")).toBeNull();
    expect(codeFromScan("")).toBeNull();
    expect(codeFromScan(null)).toBeNull();
  });
});

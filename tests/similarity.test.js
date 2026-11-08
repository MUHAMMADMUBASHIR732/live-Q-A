import { describe, it, expect } from "vitest";
import { cosineSimilarity, findDuplicate } from "../lib/similarity.js";

describe("cosineSimilarity", () => {
  it("is 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it("is 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
});

describe("findDuplicate", () => {
  const existing = [
    { id: "a", embedding: [1, 0] },
    { id: "b", embedding: [0, 1] },
  ];

  it("returns the closest match above the threshold", () => {
    expect(findDuplicate([1, 0.05], existing, 0.9).id).toBe("a");
  });

  it("returns null when nothing is similar enough", () => {
    expect(findDuplicate([1, 1], existing, 0.9)).toBeNull();
  });
});

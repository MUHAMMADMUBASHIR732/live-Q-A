import { describe, it, expect } from "vitest";
import { sortQuestions } from "../lib/sort.js";

const q = (id, upvoteCount, status = "visible", createdAt = "2026-01-01T00:00:00.000Z") => ({
  id,
  upvoteCount,
  status,
  createdAt,
});

describe("sortQuestions", () => {
  it("puts pinned questions first and answered questions last", () => {
    const result = sortQuestions([
      q("answered", 50, "answered"),
      q("normal", 5),
      q("pinned", 1, "pinned"),
    ]);
    expect(result.map((x) => x.id)).toEqual(["pinned", "normal", "answered"]);
  });

  it("sorts by votes, then newest first", () => {
    const result = sortQuestions([
      q("old", 3, "visible", "2026-01-01T00:00:00.000Z"),
      q("new", 3, "visible", "2026-01-02T00:00:00.000Z"),
      q("top", 9),
    ]);
    expect(result.map((x) => x.id)).toEqual(["top", "new", "old"]);
  });

  it("does not change the original array", () => {
    const list = [q("a", 1), q("b", 2)];
    sortQuestions(list);
    expect(list.map((x) => x.id)).toEqual(["a", "b"]);
  });
});

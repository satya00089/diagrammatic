import { describe, expect, it } from "vitest";
import { dedupeProblems } from "./problemsSlice";
import type { SystemDesignProblem } from "../../types/systemDesign";

const problem = (overrides: Partial<SystemDesignProblem> = {}) =>
  ({
    title: "Design a URL shortener",
    slug: "url-shortener-like-bit-ly",
    description: "A problem",
    difficulty: "Medium",
    category: "Systems",
    tags: [],
    ...overrides,
  }) as SystemDesignProblem;

describe("dedupeProblems", () => {
  it("keeps the first entry when records share a canonical slug", () => {
    const result = dedupeProblems([
      problem({ id: "first" }),
      problem({ id: "duplicate" }),
      problem({ slug: "different", id: "different" }),
    ]);

    expect(result.map((item) => item.id)).toEqual(["first", "different"]);
  });

  it("falls back to a normalized title when no id or slug exists", () => {
    const result = dedupeProblems([
      problem({ id: undefined, slug: undefined, title: "  Same title  " }),
      problem({ id: undefined, slug: undefined, title: "same title" }),
    ]);

    expect(result).toHaveLength(1);
  });
});

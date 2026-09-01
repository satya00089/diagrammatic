import { describe, expect, it } from "vitest";
import type { Edge, Node } from "@xyflow/react";
import { getAdaptiveFitViewOptions } from "./adaptiveFitView";

const makeNodes = (count: number): Node[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `node-${index}`,
    position: { x: index * 100, y: 0 },
    data: {},
  }));

const makeEdges = (count: number, nodeCount: number): Edge[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `edge-${index}`,
    source: `node-${index % nodeCount}`,
    target: `node-${(index + 1) % nodeCount}`,
  }));

const getPaddingPixels = (padding: unknown): { x: number; y: number } => {
  if (!padding || typeof padding !== "object") {
    throw new Error("Expected directional padding");
  }

  const value = padding as { x?: string; y?: string };
  return {
    x: Number.parseFloat(value.x ?? "0"),
    y: Number.parseFloat(value.y ?? "0"),
  };
};

describe("adaptive fit view", () => {
  it("keeps small diagrams close to the current framing", () => {
    const options = getAdaptiveFitViewOptions(
      makeNodes(2),
      makeEdges(1, 2),
      "TB",
    );

    expect(getPaddingPixels(options.padding)).toEqual({ x: 32, y: 32 });
    expect(options.minZoom).toBe(0.5);
  });

  it("adds bounded breathing room for dense ERD diagrams", () => {
    const small = getAdaptiveFitViewOptions(
      makeNodes(2),
      makeEdges(1, 2),
      "LR",
    );
    const large = getAdaptiveFitViewOptions(
      makeNodes(35),
      makeEdges(86, 35),
      "LR",
    );
    const veryLarge = getAdaptiveFitViewOptions(
      makeNodes(60),
      makeEdges(180, 60),
      "TB",
    );
    const smallPadding = getPaddingPixels(small.padding);
    const largePadding = getPaddingPixels(large.padding);
    const veryLargePadding = getPaddingPixels(veryLarge.padding);

    expect(largePadding.x).toBeGreaterThan(smallPadding.x);
    expect(largePadding.y).toBeGreaterThan(smallPadding.y);
    expect(largePadding.x).toBeLessThanOrEqual(64);
    expect(largePadding.y).toBeLessThanOrEqual(52);
    expect(large.minZoom).toBe(0.25);
    expect(veryLarge.minZoom).toBe(0.18);
    expect(veryLargePadding.x).toBeLessThanOrEqual(64);
    expect(veryLargePadding.y).toBeLessThanOrEqual(52);
  });

  it("ignores hidden nodes and their relationships", () => {
    const nodes = makeNodes(35);
    nodes.slice(2).forEach((node) => {
      node.hidden = true;
    });
    const edges = makeEdges(86, 35);
    edges.slice(1).forEach((edge) => {
      edge.hidden = true;
    });

    const options = getAdaptiveFitViewOptions(nodes, edges);

    expect(options.minZoom).toBe(0.5);
    expect(getPaddingPixels(options.padding)).toEqual({ x: 32, y: 32 });
  });
});

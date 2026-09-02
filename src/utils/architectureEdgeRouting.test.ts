import { describe, expect, it } from "vitest";
import { getDefaultArchitectureHandlePair } from "./architectureEdgeRouting";

const component = (id: string, x: number, y: number) => ({
  id,
  type: "microservice" as const,
  componentId: "backend-server",
  label: id,
  description: id,
  properties: {},
  position: { x, y },
});

const connection = (source: string, target: string) => ({
  id: `${source}-${target}`,
  source,
  target,
  type: "data-flow" as const,
  label: "Message",
});

describe("getDefaultArchitectureHandlePair", () => {
  it("routes equal-column edges between opposing vertical handles", () => {
    expect(
      getDefaultArchitectureHandlePair(connection("top", "bottom"), [
        component("top", 240, 0),
        component("bottom", 240, 360),
      ]),
    ).toEqual({ sourceHandle: "bottom", targetHandle: "top" });
  });

  it("routes equal-row reverse edges in the clearer lane when a node is between them", () => {
    expect(
      getDefaultArchitectureHandlePair(connection("right", "left"), [
        component("left", 0, 240),
        component("middle", 360, 240),
        component("right", 720, 240),
        component("upper", 360, -200),
        component("lower", 360, 400),
      ]),
    ).toEqual({ sourceHandle: "top", targetHandle: "top" });
  });

  it("routes equal-column edges around an intermediate component", () => {
    expect(
      getDefaultArchitectureHandlePair(connection("bottom", "top"), [
        component("top", 720, 0),
        component("middle", 720, 360),
        component("bottom", 720, 720),
        component("left", 0, 360),
        component("right", 1080, 360),
      ]),
    ).toEqual({ sourceHandle: "left", targetHandle: "left" });
  });
});

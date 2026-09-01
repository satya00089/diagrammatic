import { describe, expect, it } from "vitest";
import { Position } from "@xyflow/react";
import {
  ADAPTIVE_EDGE_HYSTERESIS,
  getAdaptiveConnectionSides,
  getAdaptiveEdgeGeometry,
  getHorizontalHandleSide,
  type AdaptiveEdgeNode,
} from "./adaptiveEdgeRouting";

const makeNode = (x: number): AdaptiveEdgeNode => ({
  position: { x, y: 0 },
  measured: { width: 200 },
  internals: { positionAbsolute: { x, y: 0 } },
});

describe("adaptive ERD edge routing", () => {
  it("resolves plain and field handles without changing vertical handles", () => {
    expect(getHorizontalHandleSide("right", Position.Right)).toBe("right");
    expect(getHorizontalHandleSide("field:users-id:left", Position.Right)).toBe(
      "left",
    );
    expect(getHorizontalHandleSide("top", Position.Top)).toBeUndefined();
  });

  it("keeps the current side within the 40px dead zone", () => {
    const sourceCenterX = 100;
    const targetCenterX = sourceCenterX + ADAPTIVE_EDGE_HYSTERESIS - 1;

    expect(
      getAdaptiveConnectionSides({
        sourceCenterX,
        targetCenterX,
        previousSourceSide: "left",
      }),
    ).toEqual({ sourceSide: "left", targetSide: "right" });
  });

  it("keeps the current side at the hysteresis boundary", () => {
    expect(
      getAdaptiveConnectionSides({
        sourceCenterX: 100,
        targetCenterX: 60,
        previousSourceSide: "right",
      }),
    ).toEqual({ sourceSide: "right", targetSide: "left" });
    expect(
      getAdaptiveConnectionSides({
        sourceCenterX: 100,
        targetCenterX: 140,
        previousSourceSide: "left",
      }),
    ).toEqual({ sourceSide: "left", targetSide: "right" });
  });

  it("switches only after the node centers cross the hysteresis boundary", () => {
    expect(
      getAdaptiveConnectionSides({
        sourceCenterX: 100,
        targetCenterX: 59,
        previousSourceSide: "right",
      }),
    ).toEqual({ sourceSide: "left", targetSide: "right" });
    expect(
      getAdaptiveConnectionSides({
        sourceCenterX: 100,
        targetCenterX: 141,
        previousSourceSide: "left",
      }),
    ).toEqual({ sourceSide: "right", targetSide: "left" });
  });

  it("moves render-only anchors when tables have been swapped", () => {
    const geometry = getAdaptiveEdgeGeometry({
      sourceX: 600,
      sourceY: 60,
      targetX: 200,
      targetY: 60,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      sourceHandleId: "field:users-id:right",
      targetHandleId: "field:orders-user_id:left",
      sourceNode: makeNode(400),
      targetNode: makeNode(0),
      previousSourceSide: "right",
    });

    expect(geometry.sourcePosition).toBe(Position.Left);
    expect(geometry.targetPosition).toBe(Position.Right);
    expect(geometry.sourceX).toBe(400);
    expect(geometry.targetX).toBe(200);
    expect(geometry.adapted).toBe(true);
  });

  it("uses a fallback node width when measured dimensions are not ready", () => {
    const geometry = getAdaptiveEdgeGeometry({
      sourceX: 0,
      sourceY: 25,
      targetX: 300,
      targetY: 25,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      sourceHandleId: "right",
      targetHandleId: "left",
      sourceNode: {
        position: { x: 0, y: 0 },
        width: 200,
        measured: { width: 0 },
      },
      targetNode: {
        position: { x: 300, y: 0 },
        width: 200,
        measured: { width: 0 },
      },
    });

    expect(geometry).toMatchObject({
      sourceX: 200,
      targetX: 300,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      adapted: false,
    });
  });

  it("leaves vertical routing untouched for future top/bottom support", () => {
    const geometry = getAdaptiveEdgeGeometry({
      sourceX: 100,
      sourceY: 200,
      targetX: 100,
      targetY: 500,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      sourceHandleId: "bottom",
      targetHandleId: "top",
      sourceNode: makeNode(0),
      targetNode: makeNode(-500),
    });

    expect(geometry).toMatchObject({
      sourceX: 100,
      sourceY: 200,
      targetX: 100,
      targetY: 500,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      adapted: false,
    });
  });
});

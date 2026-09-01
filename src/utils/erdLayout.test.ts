import { describe, expect, it } from "vitest";
import type { Edge, Node } from "@xyflow/react";
import {
  canUseERDLayout,
  getERDLayoutedNodes,
  isEntityTableNode,
} from "./erdLayout";

const makeEntity = (id: string, attributes: string[]): Node => ({
  id,
  type: "tableNode",
  position: { x: 0, y: 0 },
  data: {
    nodeType: "entity",
    label: id,
    attributes: attributes.map((name) => ({
      id: `${id}-${name}`,
      name,
      type: "UUID",
    })),
  },
});

describe("ERD ELK layout", () => {
  it("recognizes entity-only graphs", () => {
    const entity = makeEntity("users", ["id"]);

    expect(isEntityTableNode(entity)).toBe(true);
    expect(canUseERDLayout([entity])).toBe(true);
    expect(
      canUseERDLayout([
        entity,
        {
          id: "service",
          type: "custom",
          position: { x: 0, y: 0 },
          data: { label: "Service" },
        },
      ]),
    ).toBe(false);
  });

  it("lays out field-to-field relationships in the requested direction", async () => {
    const nodes = [
      makeEntity("users", ["id", "tenant_id"]),
      makeEntity("orders", ["id", "user_id"]),
    ];
    const edges: Edge[] = [
      {
        id: "users-orders",
        source: "users",
        sourceHandle: "field:users-id:right",
        target: "orders",
        targetHandle: "field:orders-user_id:left",
      },
    ];

    const layoutedNodes = await getERDLayoutedNodes(nodes, edges, "LR");
    const users = layoutedNodes.find((node) => node.id === "users");
    const orders = layoutedNodes.find((node) => node.id === "orders");

    expect(users?.position.x).toBeLessThan(orders?.position.x ?? -1);
    expect(users?.position.y).toEqual(expect.any(Number));
    expect(orders?.position.y).toEqual(expect.any(Number));
  });
});

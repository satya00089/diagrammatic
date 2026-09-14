import { describe, expect, it } from "vitest";
import {
  isContentSizedTableNode,
  isFieldAddressableERTable,
} from "./erdNode";

describe("ER and UML table classification", () => {
  it("keeps ER tables field-addressable and content-sized", () => {
    for (const componentId of ["entity", "weak-entity", "er-view"]) {
      expect(isFieldAddressableERTable({ componentId })).toBe(true);
      expect(isContentSizedTableNode({ componentId })).toBe(true);
    }
  });

  it("keeps UML table variants content-sized without treating them as ER tables", () => {
    for (const componentId of [
      "uml-class",
      "uml-interface",
      "uml-abstract-class",
      "uml-enum",
    ]) {
      expect(isContentSizedTableNode({ componentId })).toBe(true);
      expect(isFieldAddressableERTable({ componentId })).toBe(false);
    }
  });

  it("does not change generic table scrolling or edge semantics", () => {
    expect(isContentSizedTableNode({ componentId: "custom-table" })).toBe(
      false,
    );
    expect(isFieldAddressableERTable({ componentId: "custom-table" })).toBe(
      false,
    );
  });
});

import { describe, expect, it } from "vitest";
import { shouldUseDirectIcon } from "./iconRendering";

describe("shouldUseDirectIcon", () => {
  it("uses source SVGs for AWS security and identity icons", () => {
    expect(
      shouldUseDirectIcon("aws-detective-security-identity-compliance"),
    ).toBe(true);
    expect(
      shouldUseDirectIcon(
        "aws-iam-identity-center-security-identity-compliance",
      ),
    ).toBe(true);
  });

  it("keeps the existing S3 rasterization workaround", () => {
    expect(shouldUseDirectIcon("aws-simple-storage-service-storage")).toBe(
      true,
    );
  });

  it("leaves unaffected provider icons on the sprite path", () => {
    expect(shouldUseDirectIcon("aws-ec2-compute")).toBe(false);
    expect(shouldUseDirectIcon("azure-virtual-machine-compute")).toBe(false);
    expect(shouldUseDirectIcon()).toBe(false);
  });
});

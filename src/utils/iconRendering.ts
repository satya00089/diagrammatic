/**
 * The deployed AWS security/identity sprite sheet contains dark rasterization
 * seams in the light portions of its icons. Keep the spritesheet for every
 * other icon, but use the original SVG for this group until the source sheet
 * is regenerated.
 */
const DIRECT_ICON_COMPONENTS = new Set([
  "aws-s3-on-outposts-storage",
  "aws-simple-storage-service-storage",
  "aws-simple-storage-service-glacier-storage",
]);

export function shouldUseDirectIcon(componentId?: string): boolean {
  return (
    !!componentId &&
    (DIRECT_ICON_COMPONENTS.has(componentId) ||
      (componentId.startsWith("aws-") &&
        componentId.endsWith("-security-identity-compliance")))
  );
}

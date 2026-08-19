/**
 * These AWS bucket tiles currently contain a rasterization artifact in the
 * deployed spritesheet. Keep the spritesheet for every other icon, but use
 * the original SVG for these components until the source sheet is regenerated.
 */
const DIRECT_ICON_COMPONENTS = new Set([
  "aws-s3-on-outposts-storage",
  "aws-simple-storage-service-storage",
  "aws-simple-storage-service-glacier-storage",
]);

export function shouldUseDirectIcon(componentId?: string): boolean {
  return !!componentId && DIRECT_ICON_COMPONENTS.has(componentId);
}

import type { SpriteManifest } from "../types/sprites";

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:8000";

/**
 * Sheet PNGs are private on S3 (BlockPublicAcls).
 * Route all sprite assets through the backend API which has S3 credentials.
 */
export function sheetUrl(provider: string, sheetFile: string): string {
  return `${API_BASE}/api/sprites/${encodeURIComponent(provider)}/${encodeURIComponent(sheetFile)}`;
}

export async function fetchSpriteManifest(
  provider: string,
): Promise<SpriteManifest> {
  const url = `${API_BASE}/api/sprites/${encodeURIComponent(provider)}/manifest`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Sprite manifest not available for "${provider}" (${res.status})`);
  }
  return res.json() as Promise<SpriteManifest>;
}

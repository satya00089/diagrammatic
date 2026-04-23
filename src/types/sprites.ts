export interface SheetInfo {
  file: string;
  width: number;
  height: number;
}

export interface IconSprite {
  sheet: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GroupManifest {
  sheets: string[];
  icons: Record<string, IconSprite>;
}

export interface SpriteManifest {
  provider: string;
  generated_at: string;
  sheets: SheetInfo[];
  groups: Record<string, GroupManifest>;
  count: number;
}

/** Fully-resolved sprite position for a single component icon. */
export interface ResolvedSprite {
  sheetUrl: string;
  x: number;
  y: number;
  w: number;
  h: number;
  sheetWidth: number;
  sheetHeight: number;
}

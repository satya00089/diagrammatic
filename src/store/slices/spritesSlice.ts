import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchSpriteManifest, sheetUrl } from "../../services/spriteService";
import type { ResolvedSprite } from "../../types/sprites";

interface SpritesState {
  /** Per-provider load status */
  providerStatus: Record<string, "loading" | "ready" | "error">;
  /** Combined flat lookup: componentId → resolved sprite (across all loaded providers) */
  allIcons: Record<string, ResolvedSprite>;
}

const initialState: SpritesState = {
  providerStatus: {},
  allIcons: {},
};

export const loadSpriteManifest = createAsyncThunk(
  "sprites/loadManifest",
  async (rawProvider: string) => {
    // Always normalise to lowercase — provider IDs from DEFAULT_PROVIDERS may
    // be "AWS", "Azure", etc. while S3 keys and DynamoDB ids are all lowercase.
    const provider = rawProvider.toLowerCase();
    const manifest = await fetchSpriteManifest(provider);

    // Build sheet dimension lookup
    const dims: Record<string, { width: number; height: number }> = {};
    for (const s of manifest.sheets) {
      dims[s.file] = { width: s.width, height: s.height };
    }

    // Flatten: componentId → ResolvedSprite
    const icons: Record<string, ResolvedSprite> = {};
    for (const group of Object.values(manifest.groups)) {
      for (const [compId, sprite] of Object.entries(group.icons)) {
        const d = dims[sprite.sheet] ?? { width: 4096, height: 4096 };
        icons[compId] = {
          sheetUrl: sheetUrl(provider, sprite.sheet),
          x: sprite.x,
          y: sprite.y,
          w: sprite.w,
          h: sprite.h,
          sheetWidth: d.width,
          sheetHeight: d.height,
        };
      }
    }

    return { provider, icons };
  },
  {
    // condition runs BEFORE pending fires — avoids the race where getState()
    // inside the thunk body already sees "loading" set by its own pending action.
    // Also normalise here so the cache key is always lowercase.
    condition: (rawProvider, { getState }) => {
      const provider = rawProvider.toLowerCase();
      const status = (getState() as { sprites: SpritesState }).sprites.providerStatus[provider];
      return status !== "loading" && status !== "ready";
    },
  },
);

const spritesSlice = createSlice({
  name: "sprites",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadSpriteManifest.pending, (state, action) => {
        state.providerStatus[action.meta.arg.toLowerCase()] = "loading";
      })
      .addCase(loadSpriteManifest.fulfilled, (state, action) => {
        const { provider, icons } = action.payload;
        state.providerStatus[provider] = "ready";
        // Merge into combined flat lookup
        Object.assign(state.allIcons, icons);
      })
      .addCase(loadSpriteManifest.rejected, (state, action) => {
        state.providerStatus[action.meta.arg.toLowerCase()] = "error";
      });
  },
});

export default spritesSlice.reducer;

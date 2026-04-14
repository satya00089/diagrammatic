/**
 * Walkthroughs Slice
 * Manages guided walkthrough data with per-problem caching.
 * A walkthrough is only fetched once per session; subsequent tab switches reuse cached data.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { GuidedWalkthrough } from "../../types/systemDesign";
import { apiService } from "../../services/api";
import type { RootState } from "../index";

interface WalkthroughsState {
  /** Cached walkthroughs keyed by problem_id */
  data: Record<string, GuidedWalkthrough>;
  /** Per-problem loading flags */
  loading: Record<string, boolean>;
  /** Per-problem error strings (null = no error, "NOT_FOUND" = 404) */
  errors: Record<string, string | null>;
}

const initialState: WalkthroughsState = {
  data: {},
  loading: {},
  errors: {},
};

// ── Async thunk ────────────────────────────────────────────────────────────────

export const fetchWalkthrough = createAsyncThunk<
  GuidedWalkthrough,
  string,
  { state: RootState; rejectValue: string }
>(
  "walkthroughs/fetch",
  async (problemId, { rejectWithValue }) => {
    try {
      return await apiService.getWalkthrough(problemId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "error";
      return rejectWithValue(msg);
    }
  },
  {
    // Skip fetch if already cached
    condition: (problemId, { getState }) => {
      const state = getState();
      const cached = state.walkthroughs.data[problemId];
      const loading = state.walkthroughs.loading[problemId];
      return !cached && !loading;
    },
  },
);

// ── Slice ──────────────────────────────────────────────────────────────────────

const walkthroughsSlice = createSlice({
  name: "walkthroughs",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWalkthrough.pending, (state, action) => {
        state.loading[action.meta.arg] = true;
        state.errors[action.meta.arg] = null;
      })
      .addCase(fetchWalkthrough.fulfilled, (state, action) => {
        const problemId = action.meta.arg;
        state.data[problemId] = action.payload;
        state.loading[problemId] = false;
      })
      .addCase(fetchWalkthrough.rejected, (state, action) => {
        const problemId = action.meta.arg;
        state.loading[problemId] = false;
        state.errors[problemId] = action.payload ?? "error";
      });
  },
});

export default walkthroughsSlice.reducer;

// ── Selectors ──────────────────────────────────────────────────────────────────

export const selectWalkthrough = (state: RootState, problemId: string) =>
  state.walkthroughs.data[problemId] ?? null;

export const selectWalkthroughLoading = (state: RootState, problemId: string) =>
  state.walkthroughs.loading[problemId] ?? false;

export const selectWalkthroughError = (state: RootState, problemId: string) =>
  state.walkthroughs.errors[problemId] ?? null;

/**
 * Problems Slice
 * Manages system design problems with search, filtering, and caching
 */

import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { SystemDesignProblem } from "../../types/systemDesign";
import { apiService } from "../../services/api";

interface ProblemsState {
  // All problems cache
  problems: SystemDesignProblem[];
  // Currently displayed problems (after filtering)
  filteredProblems: SystemDesignProblem[];
  // Attempted problems (user has started working on)
  attemptedProblems: Set<string>;
  // UI state
  selectedDifficulty: string;
  selectedCategory: string;
  selectedDomain: string;
  searchQuery: string;
  loading: boolean;
  error: string | null;
  // Cache timestamp
  lastFetched: number | null;
}

const initialState: ProblemsState = {
  problems: [],
  filteredProblems: [],
  attemptedProblems: new Set(),
  selectedDifficulty: "All",
  selectedCategory: "All",
  selectedDomain: "All",
  searchQuery: "",
  loading: false,
  error: null,
  lastFetched: null,
};

// Fetch all problems from API
export const fetchProblems = createAsyncThunk(
  "problems/fetchAll",
  async (_, { getState }) => {
    const state = getState() as { problems: ProblemsState };

    // Check if we have cached data (cache for 5 minutes)
    const now = Date.now();
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes
    if (
      state.problems.lastFetched &&
      now - state.problems.lastFetched < cacheExpiry
    ) {
      return { problems: state.problems.problems, fromCache: true };
    }

    const apiUrl =
      import.meta.env.VITE_ASSESSMENT_API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/v1/all-problems`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch problems: ${response.status} ${response.statusText}`,
      );
    }

    const data: SystemDesignProblem[] = await response.json();
    return { problems: data, fromCache: false };
  },
);

// Fetch attempted problems for authenticated user
export const fetchAttemptedProblems = createAsyncThunk(
  "problems/fetchAttempted",
  async () => {
    const data = await apiService.getAttemptedProblems();
    return data;
  },
);

const problemsSlice = createSlice({
  name: "problems",
  initialState,
  reducers: {
    setSelectedDifficulty: (state, action: PayloadAction<string>) => {
      state.selectedDifficulty = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
    setSelectedDomain: (state, action: PayloadAction<string>) => {
      state.selectedDomain = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearFilters: (state) => {
      state.selectedDifficulty = "All";
      state.selectedCategory = "All";
      state.selectedDomain = "All";
      state.searchQuery = "";
    },
    clearError: (state) => {
      state.error = null;
    },
    // Local optimistic update for attempted problems
    addAttemptedProblem: (state, action: PayloadAction<string>) => {
      state.attemptedProblems.add(action.payload);
    },
    clearAttemptedProblems: (state) => {
      state.attemptedProblems.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all problems
      .addCase(fetchProblems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProblems.fulfilled, (state, action) => {
        state.loading = false;
        const { problems, fromCache } = action.payload;

        state.problems = problems;
        state.filteredProblems = problems;

        if (!fromCache) {
          state.lastFetched = Date.now();
        }
      })
      .addCase(fetchProblems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch problems";
      })
      // Fetch attempted problems
      .addCase(fetchAttemptedProblems.fulfilled, (state, action) => {
        state.attemptedProblems = new Set(action.payload);
      })
      .addCase(fetchAttemptedProblems.rejected, (_state, action) => {
        console.error(
          "Failed to fetch attempted problems:",
          action.error.message,
        );
        // Silently fail - attempted problems is a nice-to-have feature
      });
  },
});

export const {
  setSelectedDifficulty,
  setSelectedCategory,
  setSelectedDomain,
  setSearchQuery,
  clearFilters,
  clearError,
  addAttemptedProblem,
  clearAttemptedProblems,
} = problemsSlice.actions;

export default problemsSlice.reducer;

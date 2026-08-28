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
import { apiService, getApiBaseUrl } from "../../services/api";
import featuredProblems from "../../data/featuredProblems.json";

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
  nextCursor: string | null;
  hasMore: boolean;
  loadingMore: boolean;
}

const fallbackProblems = featuredProblems.map((problem) => ({
  ...problem,
  id: "",
  domain: "",
  requirements: [],
  constraints: [],
  hints: [],
})) as SystemDesignProblem[];

const initialState: ProblemsState = {
  problems: fallbackProblems,
  filteredProblems: fallbackProblems,
  attemptedProblems: new Set(),
  selectedDifficulty: "All",
  selectedCategory: "All",
  selectedDomain: "All",
  searchQuery: "",
  loading: false,
  error: null,
  lastFetched: null,
  nextCursor: null,
  hasMore: false,
  loadingMore: false,
};

interface ProblemPageResponse {
  items: SystemDesignProblem[];
  next_cursor: string | null;
  has_more: boolean;
}

const getProblemsUrl = (apiUrl: string, cursor?: string | null) => {
  const params = new URLSearchParams({ limit: "24" });
  if (cursor) params.set("cursor", cursor);
  return `${apiUrl}/api/v1/all-problems?${params.toString()}`;
};

// Fetch the first page of problems from the API.
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
      return {
        problems: state.problems.problems,
        next_cursor: state.problems.nextCursor,
        has_more: state.problems.hasMore,
        fromCache: true,
      };
    }

    const apiUrl = getApiBaseUrl(
      import.meta.env.VITE_API_URL,
      import.meta.env.VITE_ASSESSMENT_API_URL,
    );

    try {
      const response = await fetch(getProblemsUrl(apiUrl));
      if (!response.ok)
        throw new Error(`Problem catalog returned ${response.status}`);
      const data: ProblemPageResponse = await response.json();
      return { ...data, fromCache: false };
    } catch {
      return {
        problems: fallbackProblems,
        items: fallbackProblems,
        next_cursor: null,
        has_more: false,
        fromCache: false,
      };
    }
  },
);

// Fetch and append the next page using the API cursor.
export const fetchMoreProblems = createAsyncThunk(
  "problems/fetchMore",
  async (_, { getState }) => {
    const state = getState() as { problems: ProblemsState };
    const apiUrl = getApiBaseUrl(
      import.meta.env.VITE_API_URL,
      import.meta.env.VITE_ASSESSMENT_API_URL,
    );
    const response = await fetch(getProblemsUrl(apiUrl, state.problems.nextCursor));
    if (!response.ok)
      throw new Error(`Problem catalog returned ${response.status}`);
    return (await response.json()) as ProblemPageResponse;
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { problems: ProblemsState };
      return state.problems.hasMore && !state.problems.loadingMore;
    },
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
        const { items, problems, next_cursor, has_more, fromCache } =
          action.payload;
        const firstPage = items ?? problems;

        state.problems = firstPage;
        state.filteredProblems = firstPage;
        state.nextCursor = next_cursor ?? null;
        state.hasMore = has_more ?? false;

        if (!fromCache) {
          state.lastFetched = Date.now();
        }
      })
      .addCase(fetchProblems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch problems";
      })
      .addCase(fetchMoreProblems.pending, (state) => {
        state.loadingMore = true;
        state.error = null;
      })
      .addCase(fetchMoreProblems.fulfilled, (state, action) => {
        state.loadingMore = false;
        const knownIds = new Set(state.problems.map((problem) => problem.id));
        const newProblems = action.payload.items.filter(
          (problem) => !knownIds.has(problem.id),
        );
        state.problems.push(...newProblems);
        state.filteredProblems = state.problems;
        state.nextCursor = action.payload.next_cursor;
        state.hasMore = action.payload.has_more;
      })
      .addCase(fetchMoreProblems.rejected, (state, action) => {
        state.loadingMore = false;
        state.error = action.error.message || "Failed to load more problems";
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

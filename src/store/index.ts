/**
 * Redux Store Configuration
 */

import { configureStore } from "@reduxjs/toolkit";
import componentsReducer from "./slices/componentsSlice";
import problemsReducer from "./slices/problemsSlice";
import walkthroughsReducer from "./slices/walkthroughsSlice";

export const store = configureStore({
  reducer: {
    components: componentsReducer,
    problems: problemsReducer,
    walkthroughs: walkthroughsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state for serialization checks
        ignoredActions: ["components/setComponents"],
        ignoredPaths: ["components.items", "problems.attemptedProblems"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

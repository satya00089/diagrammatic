/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import componentsReducer from './slices/componentsSlice';

export const store = configureStore({
  reducer: {
    components: componentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state for serialization checks
        ignoredActions: ['components/setComponents'],
        ignoredPaths: ['components.items'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

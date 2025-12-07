/**
 * Components Slice
 * Manages component data with search, filtering, and lazy loading
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { CanvasComponent } from '../../types/canvas';
import { componentProviderService } from '../../services/componentProviderService';
import { mapComponentsToCanvas } from '../../utils/componentMapper';

// Minimal component data for palette display (without properties)
export interface MinimalComponent {
  id: string;
  platform: string;
  label: string;
  description?: string;
  group?: string;
  iconUrl?: string;
  tags?: string[];
}

interface ComponentsState {
  // Minimal components by provider (cached)
  minimalComponentsByProvider: Record<string, MinimalComponent[]>;
  // Currently displayed minimal components
  minimalComponents: MinimalComponent[];
  // Full components cache (loaded on demand)
  fullComponentsCache: Record<string, CanvasComponent>;
  // UI state
  selectedProviders: string[]; // Array to support multiple providers
  searchQuery: string;
  loading: boolean;
  error: string | null;
}

const initialState: ComponentsState = {
  minimalComponentsByProvider: {},
  minimalComponents: [],
  fullComponentsCache: {},
  selectedProviders: ['all'],
  searchQuery: '',
  loading: false,
  error: null,
};

// Fetch minimal components by provider (no properties field)
export const fetchMinimalComponents = createAsyncThunk(
  'components/fetchMinimal',
  async (providers: string[], { getState }) => {
    const state = getState() as { components: ComponentsState };
    
    // If 'all' is in providers, fetch all
    if (providers.includes('all')) {
      if (state.components.minimalComponentsByProvider['all']) {
        return { providers, items: state.components.minimalComponentsByProvider['all'], fromCache: true };
      }
      const response = await componentProviderService.getAllComponents({ limit: 500 });
      return { providers, items: response.items, fromCache: false };
    }
    
    // Fetch multiple providers
    const allItems: any[] = [];
    const providersToFetch: string[] = [];
    
    // Collect cached and identify what needs fetching
    for (const provider of providers) {
      if (state.components.minimalComponentsByProvider[provider]) {
        allItems.push(...state.components.minimalComponentsByProvider[provider]);
      } else {
        providersToFetch.push(provider);
      }
    }
    
    // Fetch uncached providers
    for (const provider of providersToFetch) {
      const response = await componentProviderService.getComponentsByProvider(
        provider as any,
        500
      );
      allItems.push(...response.items);
    }
    
    return { providers, items: allItems, fromCache: providersToFetch.length === 0 };
  }
);

// Fetch full component data (including properties) when needed
export const fetchFullComponent = createAsyncThunk(
  'components/fetchFull',
  async (id: string) => {
    const response = await componentProviderService.getComponentById(id);
    return response;
  }
);

const componentsSlice = createSlice({
  name: 'components',
  initialState,
  reducers: {
    setSelectedProviders: (state, action: PayloadAction<string[]>) => {
      state.selectedProviders = action.payload;
    },
    toggleProvider: (state, action: PayloadAction<string>) => {
      const provider = action.payload;
      if (provider === 'all') {
        state.selectedProviders = ['all'];
      } else {
        // Remove 'all' if selecting specific providers
        const filtered = state.selectedProviders.filter(p => p !== 'all');
        if (filtered.includes(provider)) {
          // Remove provider
          const updated = filtered.filter(p => p !== provider);
          state.selectedProviders = updated.length > 0 ? updated : ['all'];
        } else {
          // Add provider
          state.selectedProviders = [...filtered, provider];
        }
      }
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    cacheFullComponent: (state, action: PayloadAction<CanvasComponent>) => {
      state.fullComponentsCache[action.payload.id] = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch minimal components
      .addCase(fetchMinimalComponents.pending, (state, action) => {
        // Only show loading if fetching new data
        const providers = action.meta.arg;
        const allCached = providers.every(p => state.minimalComponentsByProvider[p]);
        if (!allCached) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchMinimalComponents.fulfilled, (state, action) => {
        state.loading = false;
        const { providers, items, fromCache } = action.payload;
        
        // Map to minimal format (exclude properties)
        const minimalItems = items.map((item: any) => ({
          id: item.id,
          platform: item.platform || 'Unknown',
          label: item.label,
          description: item.description,
          group: item.group,
          iconUrl: item.iconUrl,
          tags: item.tags,
        }));
        
        // Cache by provider if not already cached
        if (!fromCache) {
          if (providers.includes('all')) {
            state.minimalComponentsByProvider['all'] = minimalItems;
          } else {
            // Group items by provider and cache
            for (const provider of providers) {
              const providerItems = minimalItems.filter((item: MinimalComponent) => 
                item.platform?.toLowerCase() === provider.toLowerCase()
              );
              if (providerItems.length > 0) {
                state.minimalComponentsByProvider[provider] = providerItems;
              }
            }
          }
        }
        
        // Update current display
        state.minimalComponents = minimalItems;
      })
      .addCase(fetchMinimalComponents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch components';
      })
      // Fetch full component
      .addCase(fetchFullComponent.fulfilled, (state, action) => {
        const canvasComponent = mapComponentsToCanvas([action.payload])[0];
        if (canvasComponent) {
          state.fullComponentsCache[canvasComponent.id] = canvasComponent;
        }
      })
      .addCase(fetchFullComponent.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch component details';
      });
  },
});

export const { setSelectedProviders, toggleProvider, setSearchQuery, cacheFullComponent, clearError } =
  componentsSlice.actions;

export default componentsSlice.reducer;

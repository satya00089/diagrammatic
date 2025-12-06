/**
 * Component Provider Service
 * Handles API calls to fetch components from DynamoDB
 */

import type { 
  ComponentProvider, 
  ComponentCategory, 
  ComponentDB, 
  ComponentsResponse,
  QueryParams 
} from '../types/componentProvider';

export class ComponentProviderService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  /**
   * Get components by provider
   */
  async getComponentsByProvider(
    provider: ComponentProvider,
    limit = 100,
  ): Promise<ComponentsResponse> {
    try {
      const params = new URLSearchParams({
        provider,
        limit: limit.toString(),
      });

      const response = await fetch(
        `${this.baseUrl}/api/components?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching components by provider:', error);
      throw error;
    }
  }

  /**
   * Get components by category
   */
  async getComponentsByCategory(
    category: ComponentCategory,
    limit = 100,
  ): Promise<ComponentsResponse> {
    try {
      const params = new URLSearchParams({
        category,
        limit: limit.toString(),
      });

      const response = await fetch(
        `${this.baseUrl}/api/components?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching components by category:', error);
      throw error;
    }
  }

  /**
   * Get all components (with pagination and filters)
   */
  async getAllComponents(params?: QueryParams): Promise<ComponentsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.provider) queryParams.set('provider', params.provider);
      if (params?.category) queryParams.set('category', params.category);
      if (params?.group) queryParams.set('group', params.group);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.tags) queryParams.set('tags', params.tags.join(','));
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.lastEvaluatedKey) {
        queryParams.set('lastEvaluatedKey', JSON.stringify(params.lastEvaluatedKey));
      }

      const response = await fetch(
        `${this.baseUrl}/api/components?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching all components:', error);
      throw error;
    }
  }

  /**
   * Search components
   */
  async searchComponents(
    query: string,
    provider?: ComponentProvider,
    category?: ComponentCategory,
  ): Promise<ComponentsResponse> {
    try {
      const params = new URLSearchParams({ search: query });
      if (provider) params.set('provider', provider);
      if (category) params.set('category', category);

      const response = await fetch(
        `${this.baseUrl}/api/components/search?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching components:', error);
      throw error;
    }
  }

  /**
   * Get component by ID
   */
  async getComponentById(id: string): Promise<ComponentDB> {
    try {
      const response = await fetch(`${this.baseUrl}/api/components/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching component by ID:', error);
      throw error;
    }
  }

  /**
   * Increment usage count
   */
  async incrementUsageCount(id: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/components/${id}/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error incrementing usage count:', error);
      // Don't throw - usage tracking is non-critical
    }
  }

  /**
   * Get available providers
   */
  async getProviders(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/components/providers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw error;
    }
  }

  /**
   * Get available categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/components/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const componentProviderService = new ComponentProviderService();

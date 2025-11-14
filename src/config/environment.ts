/**
 * Environment configuration
 * Direct access to environment variables
 */

// API URLs
export const API_URL = import.meta.env.VITE_API_URL

// Yjs WebSocket URL with fallback to custom WebSocket
// If VITE_YJS_URL is not provided, the app will use the custom WebSocket implementation
export const YJS_URL = import.meta.env.VITE_YJS_URL

// Debug: Check if YJS_URL is configured
console.log('🔍 Environment Check:', {
  API_URL,
  YJS_URL,
  hasYjsUrl: !!YJS_URL,
})

// Helper functions for backward compatibility
export const getApiUrl = (): string => API_URL
export const getYjsUrl = (): string | undefined => YJS_URL

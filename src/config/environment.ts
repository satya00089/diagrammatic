/**
 * Environment configuration
 * Detects and provides environment-specific settings
 */

export const Environment = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const

export type Environment = (typeof Environment)[keyof typeof Environment]

export interface EnvironmentConfig {
  environment: Environment
  apiUrl: string
  yjsUrl: string
  isDevelopment: boolean
  isStaging: boolean
  isProduction: boolean
}

/**
 * Detects current environment based on hostname
 */
function detectEnvironment(): Environment {
  const hostname = globalThis.location?.hostname

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return Environment.DEVELOPMENT
  }

  if (hostname?.includes('github.io')) {
    return Environment.STAGING
  }

  return Environment.PRODUCTION
}

/**
 * Get environment-specific API URLs from environment variables
 */
function getApiUrls(): { apiUrl: string; yjsUrl: string } {
  return {
    apiUrl: import.meta.env.VITE_API_URL || '',
    yjsUrl: import.meta.env.VITE_YJS_URL || '',
  }
}

/**
 * Create environment configuration
 */
function createEnvironmentConfig(): EnvironmentConfig {
  const environment = detectEnvironment()
  const { apiUrl, yjsUrl } = getApiUrls()

  return {
    environment,
    apiUrl,
    yjsUrl,
    isDevelopment: environment === Environment.DEVELOPMENT,
    isStaging: environment === Environment.STAGING,
    isProduction: environment === Environment.PRODUCTION,
  }
}

// Export singleton instance
export const ENV_CONFIG = createEnvironmentConfig()

// Export helper functions
export const getEnvironment = (): Environment => ENV_CONFIG.environment
export const getApiUrl = (): string => ENV_CONFIG.apiUrl
export const getYjsUrl = (): string => ENV_CONFIG.yjsUrl
export const isDevelopment = (): boolean => ENV_CONFIG.isDevelopment
export const isStaging = (): boolean => ENV_CONFIG.isStaging
export const isProduction = (): boolean => ENV_CONFIG.isProduction

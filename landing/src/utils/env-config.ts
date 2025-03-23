// landing/src/utils/env-config.ts
// Enhanced environment variables management

// Define environment variable types
interface EnvVars {
  TWITCH_CLIENT_ID: string;
  TWITCH_CLIENT_SECRET?: string;
  PUBLIC_API_URL?: string;
  NODE_ENV?: string;
  [key: string]: string | undefined;
}

// Global window augmentation
declare global {
  interface Window {
    ENV: EnvVars;
    TWITCH_CLIENT_ID?: string;
    [key: string]: unknown;
  }
}

// Default fallback values - only used in development
const DEV_DEFAULTS: Partial<EnvVars> = {
  // Use empty strings in production
  TWITCH_CLIENT_ID: process.env.NODE_ENV === 'development' 
    ? "udrg080q6g8t7qbhgo67x0ytt08otn" // Only use fallback in dev
    : ""
};

/**
 * Initialize environment variables from multiple sources
 * Priority: 1. Manual config, 2. Meta tags, 3. import.meta.env, 4. Defaults
 */
export function setupEnvironment(manualConfig?: Partial<EnvVars>): EnvVars {
  // Initialize ENV object
  window.ENV = window.ENV || {} as EnvVars;
  
  // 1. Extract environment variables from meta tags
  document.querySelectorAll('meta[name^="env-"]').forEach(metaTag => {
    const name = metaTag.getAttribute('name')?.replace('env-', '');
    const value = metaTag.getAttribute('content');
    if (name && value) {
      window.ENV[name] = value;
    }
  });
  
  // 2. Add variables from Vite's import.meta.env if available
  try {
    if (import.meta.env) {
      Object.entries(import.meta.env).forEach(([key, value]) => {
        if (key.startsWith('VITE_') && typeof value === 'string') {
          const envKey = key.replace('VITE_', '');
          if (!window.ENV[envKey]) {
            window.ENV[envKey] = value;
          }
        }
      });
    }
  } catch (e) {
    console.warn('Could not access import.meta.env');
  }

  // 3. Apply any manually provided configuration (highest priority)
  if (manualConfig) {
    Object.entries(manualConfig).forEach(([key, value]) => {
      if (value !== undefined) {
        window.ENV[key] = value;
      }
    });
  }
  
  // 4. Apply defaults for missing values (lowest priority)
  Object.entries(DEV_DEFAULTS).forEach(([key, value]) => {
    if (!window.ENV[key] && value !== undefined) {
      window.ENV[key] = value;
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Using fallback value for ${key}: ${value}`);
      }
    }
  });
  
  // Set up TWITCH_CLIENT_ID global for compatibility
  if (window.ENV.TWITCH_CLIENT_ID) {
    window.TWITCH_CLIENT_ID = window.ENV.TWITCH_CLIENT_ID;
  }
  
  // Debug log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[ENV] Loaded configuration:', { ...window.ENV });
  }

  return window.ENV;
}
  
/**
 * Get an environment variable with typechecking
 * @param key - The environment variable name
 * @param defaultValue - Default value if not found
 */
export function getEnv<K extends keyof EnvVars>(key: K, defaultValue = ''): string {
  if (!window.ENV) {
    setupEnvironment();
  }
  
  return (window.ENV[key] !== undefined ? window.ENV[key] : defaultValue) as string;
}

// Export singleton
export default {
  setupEnvironment,
  getEnv
};
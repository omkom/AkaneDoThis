// landing/src/utils/env-config.ts
// Enhanced environment variables management with robust client ID handling

// Define environment variable types
interface EnvVars {
  TWITCH_CLIENT_ID: string;
  VITE_TWITCH_CLIENT_ID?: string;
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
 * Discover Twitch Client ID from all possible sources
 * with detailed logging in development mode
 */
function discoverTwitchClientId(): string | undefined {
  const sources: Array<{ name: string; value: string | undefined }> = [
    // Direct window property (highest priority)
    { name: 'window.TWITCH_CLIENT_ID', value: window.TWITCH_CLIENT_ID },
    
    // ENV object values
    { name: 'window.ENV.TWITCH_CLIENT_ID', value: window.ENV?.TWITCH_CLIENT_ID },
    { name: 'window.ENV.VITE_TWITCH_CLIENT_ID', value: window.ENV?.VITE_TWITCH_CLIENT_ID },
    
    // Process environment (will be replaced during build)
    { name: 'process.env.TWITCH_CLIENT_ID', value: process.env.TWITCH_CLIENT_ID },
    { name: 'process.env.VITE_TWITCH_CLIENT_ID', value: process.env.VITE_TWITCH_CLIENT_ID },

    // Import meta (available during build with Vite)
    // @ts-ignore - Vite specific
    { name: 'import.meta.env.TWITCH_CLIENT_ID', value: import.meta?.env?.TWITCH_CLIENT_ID },
    // @ts-ignore - Vite specific
    { name: 'import.meta.env.VITE_TWITCH_CLIENT_ID', value: import.meta?.env?.VITE_TWITCH_CLIENT_ID },
  ];

  // Find first valid source
  for (const source of sources) {
    if (source.value) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[ENV] Using Twitch Client ID from ${source.name}: ${source.value.substring(0, 5)}...`);
      }
      return source.value;
    }
  }

  // Search for any key in window.ENV that might contain relevant info
  if (window.ENV) {
    for (const [key, value] of Object.entries(window.ENV)) {
      if ((key.includes('TWITCH') || key.includes('twitch')) && 
          (key.includes('CLIENT_ID') || key.includes('client_id')) && 
          value) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[ENV] Found alternative Twitch Client ID in ${key}: ${value.substring(0, 5)}...`);
        }
        return value;
      }
    }
  }

  // Try to find it in meta tags
  const metaTags = document.querySelectorAll('meta[name^="env-"]');
  for (const tag of Array.from(metaTags)) {
    const name = tag.getAttribute('name')?.replace('env-', '');
    const value = tag.getAttribute('content');
    
    if ((name?.includes('TWITCH') || name?.includes('twitch')) && 
        (name?.includes('CLIENT_ID') || name?.includes('client_id')) && 
        value) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[ENV] Found Twitch Client ID in meta tag ${name}: ${value.substring(0, 5)}...`);
      }
      return value;
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn('[ENV] Could not find Twitch Client ID from any source');
  }
  
  return undefined;
}

/**
 * Initialize environment variables from multiple sources
 * Priority: 1. Manual config, 2. Window variables, 3. Meta tags, 4. Env vars, 5. Defaults
 */
export function setupEnvironment(manualConfig?: Partial<EnvVars>): EnvVars {
  // Initialize ENV object if it doesn't exist
  window.ENV = window.ENV || {} as EnvVars;
  
  // 1. Look for Twitch Client ID from all possible sources
  const discoveredClientId = discoverTwitchClientId();
  if (discoveredClientId) {
    window.TWITCH_CLIENT_ID = discoveredClientId;
    window.ENV.TWITCH_CLIENT_ID = discoveredClientId;
    window.ENV.VITE_TWITCH_CLIENT_ID = discoveredClientId;
  }
  
  // 2. Extract environment variables from meta tags
  document.querySelectorAll('meta[name^="env-"]').forEach(metaTag => {
    const name = metaTag.getAttribute('name')?.replace('env-', '');
    const value = metaTag.getAttribute('content');
    if (name && value) {
      window.ENV[name] = value;
    }
  });
  
  // 3. Apply any manually provided configuration (highest priority)
  if (manualConfig) {
    Object.entries(manualConfig).forEach(([key, value]) => {
      if (value !== undefined) {
        window.ENV[key] = value;
        
        // Handle Twitch client ID specifically
        if (key === 'VITE_TWITCH_CLIENT_ID' || key === 'TWITCH_CLIENT_ID') {
          window.TWITCH_CLIENT_ID = value;
          window.ENV.TWITCH_CLIENT_ID = value;
          window.ENV.VITE_TWITCH_CLIENT_ID = value;
        }
      }
    });
  }
  
  // 4. Apply defaults for missing values (lowest priority)
  Object.entries(DEV_DEFAULTS).forEach(([key, value]) => {
    if (!window.ENV[key] && value !== undefined) {
      window.ENV[key] = value;
      
      // Handle Twitch client ID specifically
      if (key === 'TWITCH_CLIENT_ID' && !window.TWITCH_CLIENT_ID) {
        window.TWITCH_CLIENT_ID = value;
        window.ENV.TWITCH_CLIENT_ID = value;
        window.ENV.VITE_TWITCH_CLIENT_ID = value;
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[ENV] Using fallback value for ${key}: ${value}`);
      }
    }
  });
  
  // Ensure TWITCH_CLIENT_ID is properly set in all locations
  if (window.ENV.TWITCH_CLIENT_ID) {
    window.TWITCH_CLIENT_ID = window.ENV.TWITCH_CLIENT_ID;
    window.ENV.VITE_TWITCH_CLIENT_ID = window.ENV.TWITCH_CLIENT_ID;
  } else if (window.ENV.VITE_TWITCH_CLIENT_ID) {
    window.TWITCH_CLIENT_ID = window.ENV.VITE_TWITCH_CLIENT_ID;
    window.ENV.TWITCH_CLIENT_ID = window.ENV.VITE_TWITCH_CLIENT_ID;
  } else if (window.TWITCH_CLIENT_ID) {
    window.ENV.TWITCH_CLIENT_ID = window.TWITCH_CLIENT_ID;
    window.ENV.VITE_TWITCH_CLIENT_ID = window.TWITCH_CLIENT_ID;
  }
  
  // Debug log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[ENV] Final environment configuration:');
    console.log('- window.TWITCH_CLIENT_ID:', window.TWITCH_CLIENT_ID);
    console.log('- window.ENV.TWITCH_CLIENT_ID:', window.ENV.TWITCH_CLIENT_ID);
    console.log('- window.ENV.VITE_TWITCH_CLIENT_ID:', window.ENV.VITE_TWITCH_CLIENT_ID);
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
  
  // Handle special case for Twitch client ID
  if (key === 'TWITCH_CLIENT_ID' as K) {
    // Check all possible locations in order of priority
    if (window.TWITCH_CLIENT_ID) {
      return window.TWITCH_CLIENT_ID as string;
    }
    if (window.ENV.TWITCH_CLIENT_ID) {
      return window.ENV.TWITCH_CLIENT_ID;
    }
    if (window.ENV.VITE_TWITCH_CLIENT_ID) {
      return window.ENV.VITE_TWITCH_CLIENT_ID;
    }
  }
  
  return (window.ENV[key] !== undefined ? window.ENV[key] : defaultValue) as string;
}

// Export singleton
export default {
  setupEnvironment,
  getEnv
};
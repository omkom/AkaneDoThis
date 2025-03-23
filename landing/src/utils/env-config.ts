// src/utils/env-config.ts
// Safely handle environment variables in the frontend

/**
 * Safely expose environment variables to the frontend
 * This is injected in the HTML at build time or runtime
 */
export function setupEnvironment(manualConfig?: Record<string, string>) {
  // Create a container for environment variables
  window.ENV = window.ENV || {};
  
  // Extract environment variables from meta tags if they exist
  const envVars = document.querySelectorAll('meta[name^="env-"]');
  envVars.forEach(metaTag => {
    const name = metaTag.getAttribute('name')?.replace('env-', '');
    const value = metaTag.getAttribute('content');
    if (name && value) {
      window.ENV[name] = value;
    }
  });
  
  // Apply any manually provided configuration
  if (manualConfig) {
    Object.assign(window.ENV, manualConfig);
  }
  
  // Set up Twitch client ID - IMPORTANT: Fallback to a hardcoded value for development
  if (window.ENV.TWITCH_CLIENT_ID) {
    window.TWITCH_CLIENT_ID = window.ENV.TWITCH_CLIENT_ID;
  } else {
    // Fallback to development value if needed
    // Replace with your actual Twitch client ID for development
    const fallbackClientId = "udrg080q6g8t7qbhgo67x0ytt08otn"; // Demo/placeholder client ID
    console.warn(`Using fallback Twitch client ID for development: ${fallbackClientId}`);
    window.TWITCH_CLIENT_ID = fallbackClientId;
    window.ENV.TWITCH_CLIENT_ID = fallbackClientId;
  }
  
  // Log environment status for debugging (not in production)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Environment Config] Environment variables loaded:', window.ENV);
  }
}
  
/**
 * Get an environment variable
 * @param {string} key - The environment variable name
 * @param {string} defaultValue - Default value if not found
 * @returns {string} The environment variable value or default
 */
export function getEnv(key: string, defaultValue = '') {
  if (window.ENV && window.ENV[key] !== undefined) {
    return window.ENV[key];
  }
  
  // Check if it's directly available
  if (window[key] !== undefined) {
    return window[key];
  }
  
  return defaultValue;
}

export default {
  setupEnvironment,
  getEnv
};

// Add this to global Window interface
declare global {
  interface Window {
    ENV: Record<string, unknown>;
    TWITCH_CLIENT_ID?: string;
    [key: string]: unknown;
  }
}

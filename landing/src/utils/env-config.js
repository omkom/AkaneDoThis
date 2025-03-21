// landing/src/utils/env-config.js
// Safely handle environment variables in the frontend

/**
 * Safely expose environment variables to the frontend
 * This is injected in the HTML at build time or runtime
 */
export function setupEnvironment() {
    // Create a container for environment variables
    window.ENV = window.ENV || {};
    
    // Extract environment variables from meta tags if they exist
    const envVars = document.querySelectorAll('meta[name^="env-"]');
    envVars.forEach(metaTag => {
      const name = metaTag.getAttribute('name').replace('env-', '');
      const value = metaTag.getAttribute('content');
      if (name && value) {
        window.ENV[name] = value;
      }
    });
    
    // Set up Twitch client ID
    if (window.ENV.TWITCH_CLIENT_ID) {
      window.TWITCH_CLIENT_ID = window.ENV.TWITCH_CLIENT_ID;
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
  export function getEnv(key, defaultValue = '') {
    if (window.ENV && window.ENV[key] !== undefined) {
      return window.ENV[key];
    }
    
    // Check if it's directly available
    if (window[key] !== undefined) {
      return window[key];
    }
    
    return defaultValue;
  }
  
  // TypeScript support moved to env-config.d.ts
  
  export default {
    setupEnvironment,
    getEnv
  };
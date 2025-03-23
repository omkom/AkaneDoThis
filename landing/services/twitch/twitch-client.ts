// services/twitch/twitch-client.ts
// Global configuration and utility functions for Twitch integration with improved client ID handling

/**
 * Safely get client ID from various sources with enhanced priority handling
 */
function getClientId(): string {
  try {
    if (typeof window !== 'undefined') {
      // First priority: Directly set TWITCH_CLIENT_ID
      if (window.TWITCH_CLIENT_ID && typeof window.TWITCH_CLIENT_ID === 'string' && window.TWITCH_CLIENT_ID.length > 0) {
        console.log('[Twitch] Using window.TWITCH_CLIENT_ID');
        return window.TWITCH_CLIENT_ID;
      }
      
      // Second priority: Check ENV object for TWITCH_CLIENT_ID
      if (window.ENV?.TWITCH_CLIENT_ID) {
        const id = window.ENV.TWITCH_CLIENT_ID;
        if (id && typeof id === 'string' && id.length > 0) {
          console.log('[Twitch] Using window.ENV.TWITCH_CLIENT_ID');
          return id;
        }
      }
      
      // Third priority: Check ENV object for VITE_TWITCH_CLIENT_ID
      if (window.ENV?.VITE_TWITCH_CLIENT_ID) {
        const id = window.ENV.VITE_TWITCH_CLIENT_ID;
        if (id && typeof id === 'string' && id.length > 0) {
          console.log('[Twitch] Using window.ENV.VITE_TWITCH_CLIENT_ID');
          return id;
        }
      }
      
      // Look for any other key in ENV that might contain TWITCH and CLIENT_ID
      if (window.ENV) {
        for (const [key, value] of Object.entries(window.ENV)) {
          if (key.includes('TWITCH') && key.includes('CLIENT_ID') && value && typeof value === 'string' && value.length > 0) {
            console.log(`[Twitch] Using window.ENV.${key}`);
            return value;
          }
        }
      }
    }
    
    // Check for import.meta.env - this will work during build time with Vite
    try {
      // @ts-ignore - this is a Vite-specific global
      if (import.meta && import.meta.env) {
        // Check various possible env keys
        // @ts-ignore - this is a Vite-specific global
        const viteClientId = import.meta.env.VITE_TWITCH_CLIENT_ID || 
                            // @ts-ignore
                            import.meta.env.TWITCH_CLIENT_ID;
        
        if (viteClientId && typeof viteClientId === 'string' && viteClientId.length > 0) {
          console.log('[Twitch] Using import.meta.env client ID');
          return viteClientId;
        }
      }
    } catch (e) {
      // Ignore errors accessing import.meta
    }
    
    // Try process.env for environment variables (Node.js environments)
    if (typeof process !== 'undefined' && process.env) {
      const nodeClientId = process.env.VITE_TWITCH_CLIENT_ID || 
                           process.env.TWITCH_CLIENT_ID;
                           
      if (nodeClientId && typeof nodeClientId === 'string' && nodeClientId.length > 0) {
        console.log('[Twitch] Using process.env client ID');
        return nodeClientId;
      }
    }
    
    // If we get here, we couldn't find a valid client ID
    console.warn('[Twitch] Could not find a valid Twitch client ID in any environment');
    
    // For development environments only, provide a fallback
    if (process.env.NODE_ENV === 'development' || 
        // @ts-ignore
        (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'development')) {
      const fallbackId = "udrg080q6g8t7qbhgo67x0ytt08otn"; // Demo/placeholder
      console.warn(`[Twitch] Using fallback Twitch client ID for development: ${fallbackId}`);
      return fallbackId;
    }
    
    return '';
  } catch (error) {
    console.error('[Twitch] Error getting Twitch client ID:', error);
    return '';
  }
}

/**
 * Main Twitch configuration singleton
 */
export const TWITCH_CONFIG = {
  CLIENT_ID: getClientId(),
  CHANNEL_NAME: 'akanedothis',
  AUTH_STORAGE_KEY: 'twitch_auth_data',
  STORAGE_KEY_TOKEN: 'twitch_auth_token',
  STORAGE_KEY_USER: 'twitch_user_data',
  STORAGE_KEY_EXPIRY: 'twitch_token_expiry',
  TOKEN_REFRESH_INTERVAL: 3600000, // 1 hour in milliseconds
  REDIRECT_URI: typeof window !== 'undefined' ? `${window.location.origin}/twitch-callback.html` : '',
  API_BASE_URL: 'https://api.twitch.tv/helix',
  AUTH_BASE_URL: 'https://id.twitch.tv/oauth2',
  MAX_RETRY_ATTEMPTS: 2,
};

// Log the client ID in development
if (process.env.NODE_ENV !== 'production') {
  console.log(`[Twitch] Configuration initialized with CLIENT_ID: ${TWITCH_CONFIG.CLIENT_ID.substring(0, 5)}...`);
}

/**
 * Validate environment configuration
 * @returns {boolean} True if config is valid, false otherwise
 */
export function validateConfig(): boolean {
  const hasClientId = !!TWITCH_CONFIG.CLIENT_ID;
  
  if (!hasClientId) {
    console.error('[Twitch] Twitch Client ID is missing! Set VITE_TWITCH_CLIENT_ID in your environment');
    return false;
  }
  
  return true;
}

// Rest of the code remains the same...
// (Format functions stay the same)

/**
 * Format numerical values for display (e.g., 1.2K, 3.4M)
 * @param {number|undefined} num - The number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '0';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  
  return num.toString();
}

/**
 * Calculate and format stream duration
 * @param {string|undefined} startedAt - ISO date string when stream started
 * @returns {string} Formatted duration string (e.g., "3h 45m")
 */
export function getStreamDuration(startedAt: string | undefined): string {
  if (!startedAt) return '';
  
  const startTime = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - startTime.getTime();
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
}

/**
 * Get URL for Twitch channel
 * @param {string} channelName - Twitch channel name
 * @returns {string} Full URL to Twitch channel
 */
export function getTwitchChannelUrl(channelName: string): string {
  return `https://twitch.tv/${channelName}`;
}

/**
 * Format thumbnail URL to specific dimensions
 * @param {string} url - Twitch thumbnail URL with {width} and {height} placeholders
 * @param {number} width - Desired width
 * @param {number} height - Desired height
 * @returns {string} Formatted thumbnail URL
 */
export function formatThumbnailUrl(url: string, width = 300, height = 300): string {
  if (!url) return '';
  return url.replace('{width}', width.toString()).replace('{height}', height.toString());
}
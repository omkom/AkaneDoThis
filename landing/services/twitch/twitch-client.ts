// services/twitch/twitch-client.ts
// Global configuration and utility functions for Twitch integration

/**
 * Safely get client ID from various sources
 */
function getClientId(): string {
  try {
    if (typeof window !== 'undefined') {
      // Try window.ENV first (set by server-side)
      if (window.ENV?.TWITCH_CLIENT_ID) {
        const id = window.ENV.TWITCH_CLIENT_ID as string;
        if (id && typeof id === 'string' && id.length > 0) {
          return id;
        }
      }
      
      // Try window.TWITCH_CLIENT_ID (set by twitch-auth-client.js)
      if (window.TWITCH_CLIENT_ID && typeof window.TWITCH_CLIENT_ID === 'string' && window.TWITCH_CLIENT_ID.length > 0) {
        return window.TWITCH_CLIENT_ID;
      }
    }
    
    // Try process.env for environment variables (Node.js environments)
    if (typeof process !== 'undefined' && process.env && process.env.VITE_TWITCH_CLIENT_ID) {
      return process.env.VITE_TWITCH_CLIENT_ID;
    }
    
    // If we get here, we couldn't find a valid client ID
    console.warn('Could not find a valid Twitch client ID in any environment');
    
    // For development environments only, provide a fallback
    if (process.env.NODE_ENV === 'development') {
      const fallbackId = "udrg080q6g8t7qbhgo67x0ytt08otn"; // Demo/placeholder
      console.warn(`Using fallback Twitch client ID: ${fallbackId}`);
      return fallbackId;
    }
    
    // In production, throw an error instead of using a fallback
    if (process.env.NODE_ENV === 'production') {
      throw new Error('No Twitch client ID found in production environment');
    }
    
    return '';
  } catch (error) {
    console.error('Error getting Twitch client ID:', error);
    // In production, you might want to report this to your error tracking service
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

/**
 * Validate environment configuration
 * @returns {boolean} True if config is valid, false otherwise
 */
export function validateConfig(): boolean {
  const hasClientId = !!TWITCH_CONFIG.CLIENT_ID;
  
  if (!hasClientId) {
    console.error('Twitch Client ID is missing! Set VITE_TWITCH_CLIENT_ID in your environment');
    return false;
  }
  
  return true;
}

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
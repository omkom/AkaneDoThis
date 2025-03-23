/**
 * Twitch client configuration and utilities
 */

// Main Twitch configuration
export const TWITCH_CONFIG = {
    CLIENT_ID: import.meta.env.VITE_TWITCH_CLIENT_ID || '',
    CHANNEL_NAME: 'akanedothis',
    AUTH_STORAGE_KEY: 'twitch_auth_data',
    TOKEN_REFRESH_INTERVAL: 3600000, // 1 hour in milliseconds
    STORAGE_KEY_TOKEN: 'twitch_auth_token',
    STORAGE_KEY_USER: 'twitch_user_data',
    STORAGE_KEY_EXPIRY: 'twitch_token_expiry',
    REDIRECT_URI: window.location.origin + '/twitch-callback.html',
  };
  
  // Validate environment configuration
  export function validateConfig(): boolean {
    if (!TWITCH_CONFIG.CLIENT_ID) {
      console.error('Twitch Client ID is missing! Set VITE_TWITCH_CLIENT_ID in your environment');
      return false;
    }
    return true;
  }
  
  // Format numbers for display (e.g., 1.2K, 3.4M)
  export function formatNumber(num: number | undefined): string {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
  
  // Format stream duration
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
  
  // Get URL for Twitch channel
  export function getTwitchChannelUrl(channelName: string): string {
    return `https://twitch.tv/${channelName}`;
  }
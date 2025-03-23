/**
 * Twitch authentication service
 */
import { TWITCH_CONFIG } from './twitch-client';

export interface TwitchUserData {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  view_count: number;
  created_at: string;
  email?: string;
  description?: string;
}

export interface TwitchAuthData {
  token: string;
  userData: TwitchUserData;
}

/**
 * Retrieves stored authentication data from localStorage
 */
export function getStoredAuth(): TwitchAuthData | null {
  const token = localStorage.getItem(TWITCH_CONFIG.STORAGE_KEY_TOKEN);
  const expiry = localStorage.getItem(TWITCH_CONFIG.STORAGE_KEY_EXPIRY);
  
  if (token && expiry && new Date(expiry) > new Date()) {
    try {
      const userDataString = localStorage.getItem(TWITCH_CONFIG.STORAGE_KEY_USER);
      if (!userDataString) return null;
      
      const userData = JSON.parse(userDataString) as TwitchUserData;
      return {
        token,
        userData
      };
    } catch (e) {
      console.error('Error parsing stored Twitch auth data:', e);
      clearAuth();
      return null;
    }
  }
  
  return null;
}

/**
 * Stores authentication data in localStorage
 */
export function storeAuth(token: string, userData: TwitchUserData): void {
  // Store token and user data with expiry (default to 1 hour)
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);
  
  localStorage.setItem(TWITCH_CONFIG.STORAGE_KEY_TOKEN, token);
  localStorage.setItem(TWITCH_CONFIG.STORAGE_KEY_USER, JSON.stringify(userData));
  localStorage.setItem(TWITCH_CONFIG.STORAGE_KEY_EXPIRY, expiry.toISOString());
}

/**
 * Check if a token is valid
 */
export async function validateToken(token: string | null): Promise<boolean> {
  try {
    if (!token) return false;
    
    const response = await fetch('https://id.twitch.tv/oauth2/validate', {
      headers: {
        'Authorization': `OAuth ${token}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error validating Twitch token:', error);
    return false;
  }
}

/**
 * Fetch user data with a token
 */
export async function fetchUserData(token: string): Promise<TwitchUserData> {
  if (!token) {
    throw new Error('Token is required to fetch user data');
  }

  const response = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-ID': TWITCH_CONFIG.CLIENT_ID
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user data: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data[0] as TwitchUserData;
}

/**
 * Get application token from backend
 */
export async function getAppToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/twitch/app-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get app token: ${response.status}`);
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting application token:', error);
    return null;
  }
}

/**
 * Revoke a Twitch token
 */
export async function revokeToken(token: string | null): Promise<boolean> {
  if (!token) return true;
  
  try {
    const response = await fetch(`https://id.twitch.tv/oauth2/revoke?client_id=${TWITCH_CONFIG.CLIENT_ID}&token=${token}`, {
      method: 'POST'
    });
    
    // Clear storage even if revocation fails
    clearAuth();
    
    return response.ok;
  } catch (error) {
    console.error('Error revoking token:', error);
    clearAuth();
    return false;
  }
}

/**
 * Clear local authentication data
 */
export function clearAuth(): void {
  localStorage.removeItem(TWITCH_CONFIG.STORAGE_KEY_TOKEN);
  localStorage.removeItem(TWITCH_CONFIG.STORAGE_KEY_USER);
  localStorage.removeItem(TWITCH_CONFIG.STORAGE_KEY_EXPIRY);
}

/**
 * Get the best available token (user token or app token)
 */
export async function getBestAvailableToken(): Promise<string | null> {
  // First try to get stored user auth
  const storedAuth = getStoredAuth();
  if (storedAuth && storedAuth.token) {
    const isValid = await validateToken(storedAuth.token);
    if (isValid) {
      return storedAuth.token;
    }
    
    // If stored token is invalid, clear it
    clearAuth();
  }
  
  // Fall back to app token
  return await getAppToken();
}
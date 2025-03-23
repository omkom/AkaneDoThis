// services/twitch/twitch-auth.ts
// Updated to handle development environment better

import { TWITCH_CONFIG } from './twitch-client';
import { TwitchAuthData, TwitchUserData } from './twitch-types';

/**
 * Retrieves stored authentication data from localStorage
 * @returns {TwitchAuthData|null} Authentication data or null if not found/invalid
 */
export function getStoredAuth(): TwitchAuthData | null {
  // Ensure we're in browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  
  try {
    const token = localStorage.getItem(TWITCH_CONFIG.STORAGE_KEY_TOKEN);
    const expiry = localStorage.getItem(TWITCH_CONFIG.STORAGE_KEY_EXPIRY);
    
    if (!token || !expiry) {
      return null;
    }
    
    // Check if token is expired
    if (new Date(expiry) <= new Date()) {
      clearAuth();
      return null;
    }
    
    const userDataString = localStorage.getItem(TWITCH_CONFIG.STORAGE_KEY_USER);
    if (!userDataString) {
      return null;
    }
    
    const userData = JSON.parse(userDataString) as TwitchUserData;
    
    return {
      token,
      userData
    };
  } catch (error) {
    console.error('Error parsing stored Twitch auth data:', error);
    clearAuth();
    return null;
  }
}

/**
 * Stores authentication data in localStorage
 * @param {string} token - Twitch access token
 * @param {TwitchUserData} userData - Twitch user data
 * @param {number} expiresIn - Token expiration time in seconds
 */
export function storeAuth(token: string, userData: TwitchUserData, expiresIn = 3600): void {
  // Ensure we're in browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  
  try {
    // Calculate expiry time
    const expiry = new Date();
    expiry.setSeconds(expiry.getSeconds() + expiresIn);
    
    localStorage.setItem(TWITCH_CONFIG.STORAGE_KEY_TOKEN, token);
    localStorage.setItem(TWITCH_CONFIG.STORAGE_KEY_USER, JSON.stringify(userData));
    localStorage.setItem(TWITCH_CONFIG.STORAGE_KEY_EXPIRY, expiry.toISOString());
  } catch (error) {
    console.error('Error storing Twitch auth data:', error);
  }
}

/**
 * Validates a Twitch authentication token
 * @param {string|null} token - Token to validate
 * @returns {Promise<boolean>} True if valid, false otherwise
 */
export async function validateToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(`${TWITCH_CONFIG.AUTH_BASE_URL}/validate`, {
        headers: {
          'Authorization': `OAuth ${token}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        // Update expiry info if valid
        if (data.expires_in) {
          const expiry = new Date();
          expiry.setSeconds(expiry.getSeconds() + data.expires_in);
          
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(TWITCH_CONFIG.STORAGE_KEY_EXPIRY, expiry.toISOString());
          }
        }
        
        return true;
      }
      
      return false;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.warn('Token validation request timed out');
      } else {
        console.error('Fetch error during token validation:', fetchError);
      }
      
      // On network error, consider token potentially valid but flagged for revalidation
      // We don't want to log the user out just because of network problems
      return false;
    }
  } catch (error) {
    console.error('Error validating Twitch token:', error);
    return false;
  }
}

// Addition to AuthContext or a utility function to safely check auth
export function safeGetTwitchAuth(): { token: string, userData: any } | null {
  try {
    if (typeof window === 'undefined' || !window.getTwitchAuth) {
      return null;
    }
    
    const auth = window.getTwitchAuth();
    if (auth && auth.token && auth.userData) {
      return auth;
    }
    return null;
  } catch (error) {
    console.error('Error safely getting Twitch auth:', error);
    return null;
  }
}

/**
 * Fetch user data with a token
 * @param {string} token - Valid Twitch access token
 * @returns {Promise<TwitchUserData>} User data
 */
export async function fetchUserData(token: string): Promise<TwitchUserData> {
  if (!token) {
    throw new Error('Token is required to fetch user data');
  }
  
  try {
    const response = await fetch(`${TWITCH_CONFIG.API_BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-ID': TWITCH_CONFIG.CLIENT_ID
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !data.data[0]) {
      throw new Error('No user data returned from Twitch API');
    }
    
    return data.data[0] as TwitchUserData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}

/**
 * Get application access token from backend or direct Twitch API
 * @returns {Promise<string|null>} App access token or null if error
 */
export async function getAppToken(): Promise<string | null> {
  try {
    // First try backend endpoint
    try {
      const response = await fetch('/api/twitch/app-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.access_token;
      }
    } catch (backendError) {
      console.warn('Could not get app token from backend:', backendError);
      // Fall through to alternative method
    }
    
    // Alternative method using client credentials if available
    // This should be implemented securely on the server side
    if (typeof window !== 'undefined' && window.ENV && window.ENV.TWITCH_CLIENT_ID) {
      try {
        // Use a server-side proxy endpoint that protects the client secret
        const altResponse = await fetch('/api/twitch/alt-token', {
          method: 'POST'
        });
        
        if (altResponse.ok) {
          const altData = await altResponse.json();
          return altData.access_token;
        }
      } catch (altError) {
        console.error('Alternative token method failed:', altError);
      }
    }
    
    console.error('All methods to obtain Twitch app token failed');
    return null;
  } catch (error) {
    console.error('Error getting app token:', error);
    return null;
  }
}

/**
 * Revoke a Twitch token
 * @param {string|null} token - Token to revoke
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function revokeToken(token: string | null): Promise<boolean> {
  if (!token) return true; // Already no token, consider success
  
  try {
    const response = await fetch(`${TWITCH_CONFIG.AUTH_BASE_URL}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: TWITCH_CONFIG.CLIENT_ID,
        token: token
      })
    });
    
    // Clear storage regardless of response
    clearAuth();
    
    return response.ok;
  } catch (error) {
    console.error('Error revoking token:', error);
    clearAuth();
    return false;
  }
}

/**
 * Clear all authentication data from localStorage
 */
export function clearAuth(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(TWITCH_CONFIG.STORAGE_KEY_TOKEN);
    localStorage.removeItem(TWITCH_CONFIG.STORAGE_KEY_USER);
    localStorage.removeItem(TWITCH_CONFIG.STORAGE_KEY_EXPIRY);
  }
}

/**
 * Get the best available token (user token or app token)
 * @returns {Promise<string|null>} Best available token or null if none
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
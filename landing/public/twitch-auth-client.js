/**
 * Enhanced Twitch Authentication Client
 * Streamlined implementation for robust authentication flow
 */

(function() {
  // Core configuration
  const AUTH_CONFIG = {
    clientId: '',
    redirectUri: window.location.origin + '/twitch-callback.html',
    storage: {
      token: 'twitch_auth_token',
      user: 'twitch_user_data',
      expiry: 'twitch_token_expiry'
    },
    api: {
      auth: 'https://id.twitch.tv/oauth2',
      helix: 'https://api.twitch.tv/helix'
    },
    // Default scopes needed for the app functionality including subscription reading
    defaultScopes: [
      'user:read:follows', 
      'user:edit:follows', 
      'user:read:subscriptions',
      'channel:read:subscriptions',
      'channel:read:vips',      // Add this line for VIP reading
      'channel:manage:vips'     // Add this line for VIP management
    ]
  };

  // Initialize client ID from various sources
  function initClientId() {
    // Check all possible sources in priority order
    AUTH_CONFIG.clientId = 
      window.TWITCH_CLIENT_ID || 
      (window.ENV && window.ENV.TWITCH_CLIENT_ID) ||
      '';
    
    if (!AUTH_CONFIG.clientId) {
      console.warn('Twitch Client ID not found. Authentication will fail.');
    }
    
    return AUTH_CONFIG.clientId;
  }

  // Set client ID externally
  window.setTwitchClientId = function(clientId) {
    if (clientId) {
      AUTH_CONFIG.clientId = clientId;
      window.TWITCH_CLIENT_ID = clientId;
    }
  };

  // Get stored auth data with validation
  window.getTwitchAuth = function() {
    try {
      const token = localStorage.getItem(AUTH_CONFIG.storage.token);
      const expiry = localStorage.getItem(AUTH_CONFIG.storage.expiry);
      
      // Check if token exists and is not expired
      if (token && expiry && new Date(expiry) > new Date()) {
        const userData = JSON.parse(localStorage.getItem(AUTH_CONFIG.storage.user) || 'null');
        if (userData) {
          return { token, userData };
        }
      }
    } catch (err) {
      console.error('Error retrieving auth data:', err);
      // Clear potentially corrupted data
      clearAuthData();
    }
    
    return null;
  };

  // Validate token with Twitch API
  window.validateTwitchToken = async function(token) {
    if (!token) return false;
    
    try {
      const response = await fetch(`${AUTH_CONFIG.api.auth}/validate`, {
        headers: {
          'Authorization': `OAuth ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update expiry time
        if (data.expires_in) {
          const expiry = new Date();
          expiry.setSeconds(expiry.getSeconds() + data.expires_in);
          localStorage.setItem(AUTH_CONFIG.storage.expiry, expiry.toISOString());
        }
        
        return true;
      }
      
      // Token invalid, clean up
      clearAuthData();
      return false;
    } catch (err) {
      console.error('Token validation error:', err);
      return false;
    }
  };

  // Revoke token and clear stored data
  window.logoutFromTwitch = async function(token) {
    // Use provided token or stored token
    token = token || localStorage.getItem(AUTH_CONFIG.storage.token);
    
    // Clear stored data first
    clearAuthData();
    
    if (!token) return true; // Already logged out
    
    try {
      // Ensure client ID is available
      const clientId = AUTH_CONFIG.clientId || initClientId();
      if (!clientId) {
        console.error('Cannot revoke token: Client ID not available');
        return false;
      }
      
      const response = await fetch(`${AUTH_CONFIG.api.auth}/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: clientId,
          token: token
        })
      });
      
      return response.ok;
    } catch (err) {
      console.error('Error revoking token:', err);
      return false;
    }
  };

  // Main login function
  window.loginWithTwitch = function(scopes) {
    // Use provided scopes or default scopes
    scopes = scopes || AUTH_CONFIG.defaultScopes;
    
    return new Promise((resolve, reject) => {
      // Check for existing valid auth
      const existingAuth = window.getTwitchAuth();
      if (existingAuth) {
        // Validate existing token
        window.validateTwitchToken(existingAuth.token)
          .then(isValid => {
            if (isValid) {
              return resolve(existingAuth);
            }
            // Token invalid, continue with new login
            startAuthFlow(scopes, resolve, reject);
          })
          .catch(() => startAuthFlow(scopes, resolve, reject));
      } else {
        // No existing auth, start new flow
        startAuthFlow(scopes, resolve, reject);
      }
    });
  };

  // Start authentication flow
  function startAuthFlow(scopes, resolve, reject) {
    // Ensure client ID is available
    const clientId = AUTH_CONFIG.clientId || initClientId();
    if (!clientId) {
      return reject(new Error('Twitch Client ID not available. Authentication cannot proceed.'));
    }
    
    // Generate state for CSRF protection
    const state = generateRandomState();
    
    // Build auth URL
    const authUrl = buildAuthUrl(clientId, scopes, state);
    
    // Set up message listener
    setupMessageListener(state, resolve, reject);
    
    // Open auth popup
    openAuthWindow(authUrl, reject);
  }

  // Generate random state for CSRF protection
  function generateRandomState() {
    return Math.random().toString(36).substring(2, 15);
  }

  // Build authentication URL
  function buildAuthUrl(clientId, scopes, state) {
    return `${AUTH_CONFIG.api.auth}/authorize?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(AUTH_CONFIG.redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(scopes.join(' '))}` +
      `&state=${state}` +
      `&force_verify=true`;
  }

  // Set up message listener for auth callback
  function setupMessageListener(state, resolve, reject) {
    // Remove any existing listener
    if (window._twitchAuthHandler) {
      window.removeEventListener('message', window._twitchAuthHandler);
    }
    
    // Create new handler
    const messageHandler = async function(event) {
      // Only process messages from our domain
      if (event.origin !== window.location.origin) return;
      
      // Check if this is an auth message
      if (!event.data || typeof event.data !== 'object' || event.data.type !== 'TWITCH_AUTH') return;
      
      // We got an auth message, clean up listener
      window.removeEventListener('message', messageHandler);
      delete window._twitchAuthHandler;
      
      // Close auth window if it's still open
      if (window._twitchAuthWindow && !window._twitchAuthWindow.closed) {
        window._twitchAuthWindow.close();
        window._twitchAuthWindow = null;
      }
      
      // Check if we have a token
      if (!event.data.token) {
        return reject(new Error('No authentication token received'));
      }
      
      // Validate state for CSRF protection
      if (event.data.state !== state) {
        return reject(new Error('Invalid state parameter. Possible CSRF attack.'));
      }
      
      try {
        // Get user info with token
        const userData = await getUserInfo(event.data.token);
        
        // Store authentication data
        storeAuthData(event.data.token, userData);
        
        // Resolve with auth data
        resolve({
          token: event.data.token,
          userData: userData
        });
      } catch (err) {
        reject(err);
      }
    };
    
    // Store handler reference for cleanup
    window._twitchAuthHandler = messageHandler;
    
    // Add message listener
    window.addEventListener('message', messageHandler);
  }

  // Open auth window
  function openAuthWindow(authUrl, reject) {
    try {
      // Calculate centered position
      const width = 800;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      // Open popup window
      window._twitchAuthWindow = window.open(
        authUrl,
        'TwitchAuth',
        `width=${width},height=${height},left=${left},top=${top}` +
        ',scrollbars=yes,status=yes,menubar=no,toolbar=no,location=yes'
      );
      
      // Check if popup was blocked
      if (!window._twitchAuthWindow || window._twitchAuthWindow.closed) {
        reject(new Error('Authentication window blocked. Please allow popups for this site.'));
        return;
      }
      
      // Set interval to check if window was closed
      const checkInterval = setInterval(() => {
        if (window._twitchAuthWindow && window._twitchAuthWindow.closed) {
          clearInterval(checkInterval);
          
          // Only reject if handler is still present (auth not completed)
          if (window._twitchAuthHandler) {
            window.removeEventListener('message', window._twitchAuthHandler);
            delete window._twitchAuthHandler;
            reject(new Error('Authentication cancelled: window was closed'));
          }
        }
      }, 1000);
    } catch (err) {
      reject(new Error(`Failed to open authentication window: ${err.message}`));
    }
  }

  // Get user info from Twitch API
  async function getUserInfo(token) {
    const clientId = AUTH_CONFIG.clientId || initClientId();
    if (!clientId) {
      throw new Error('Twitch Client ID not available');
    }
    
    try {
      const response = await fetch(`${AUTH_CONFIG.api.helix}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Client-ID': clientId
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.data || !data.data[0]) {
        throw new Error('No user data returned from Twitch API');
      }
      
      return data.data[0];
    } catch (err) {
      console.error('Error fetching user info:', err);
      throw new Error('Failed to retrieve user information');
    }
  }

  // Store authentication data
  function storeAuthData(token, userData, expiresIn = 3600) {
    try {
      // Calculate expiry time (default 1 hour)
      const expiry = new Date();
      expiry.setSeconds(expiry.getSeconds() + expiresIn);
      
      // Store data
      localStorage.setItem(AUTH_CONFIG.storage.token, token);
      localStorage.setItem(AUTH_CONFIG.storage.user, JSON.stringify(userData));
      localStorage.setItem(AUTH_CONFIG.storage.expiry, expiry.toISOString());
    } catch (err) {
      console.error('Error storing auth data:', err);
    }
  }

  // Clear authentication data
  function clearAuthData() {
    localStorage.removeItem(AUTH_CONFIG.storage.token);
    localStorage.removeItem(AUTH_CONFIG.storage.user);
    localStorage.removeItem(AUTH_CONFIG.storage.expiry);
  }

  // Initialize when loaded
  initClientId();
  
  // Confirm initialization
  console.log('Twitch authentication client loaded successfully');
})();
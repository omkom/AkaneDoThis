// Enhanced twitch-auth-client.js
// Script for handling Twitch authentication on the client side

(function() {
  // Configuration
  let TWITCH_CLIENT_ID = window.TWITCH_CLIENT_ID || ''; // Injected from environment variables
  const REDIRECT_URI = window.location.origin + '/twitch-callback.html';
  
  // Handle case where TWITCH_CLIENT_ID might be set after this script loads
  if (!TWITCH_CLIENT_ID) {
    console.warn('TWITCH_CLIENT_ID is not defined initially - will check later when needed');
    
    // Fallback client ID for development - replace with your actual client ID
    const FALLBACK_CLIENT_ID = "udrg080q6g8t7qbhgo67x0ytt08otn"; // Demo/placeholder
    
    // Setup a getter that will check for the ID whenever it's accessed
    Object.defineProperty(window, '_TWITCH_CLIENT_ID', {
      get: function() {
        // Try to get from window.TWITCH_CLIENT_ID first
        if (window.TWITCH_CLIENT_ID) {
          return window.TWITCH_CLIENT_ID;
        }
        
        // Try to get from ENV
        if (window.ENV && window.ENV.TWITCH_CLIENT_ID) {
          return window.ENV.TWITCH_CLIENT_ID;
        }
        
        // Fall back to development value with warning
        console.warn('Using fallback TWITCH_CLIENT_ID for development');
        return FALLBACK_CLIENT_ID;
      }
    });
  } else {
    window._TWITCH_CLIENT_ID = TWITCH_CLIENT_ID;
  }
  
  // Storage keys
  const STORAGE_KEY_TOKEN = 'twitch_auth_token';
  const STORAGE_KEY_USER = 'twitch_user_data';
  const STORAGE_KEY_EXPIRY = 'twitch_token_expiry';
  
  /**
   * Open a popup window for Twitch authentication
   * @param {Array<string>} scopes - Requested permissions
   * @returns {Promise<Object>} - Token and user data
   */
  window.loginWithTwitch = function(scopes = ['user:read:follows']) {
    return new Promise((resolve, reject) => {
      // Ensure we have a client ID
      const clientId = window._TWITCH_CLIENT_ID;
      if (!clientId) {
        return reject(new Error('Twitch Client ID is not available. Authentication cannot proceed.'));
      }
      
      // Check for existing valid token
      const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      const storedExpiry = localStorage.getItem(STORAGE_KEY_EXPIRY);
      
      if (storedToken && storedExpiry && new Date(storedExpiry) > new Date()) {
        try {
          const userData = JSON.parse(localStorage.getItem(STORAGE_KEY_USER));
          if (userData) {
            console.log('Using stored Twitch authentication');
            return resolve({
              token: storedToken,
              userData: userData
            });
          }
        } catch (error) {
          console.warn('Error parsing stored user data:', error);
          // Continue with new authentication
        }
      }
      
      // Generate a random state for security
      const state = Math.random().toString(36).substring(2, 15);
      
      // Build the authentication URL
      const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${encodeURIComponent(scopes.join(' '))}&state=${state}`;
      
      console.log("Opening auth URL:", authUrl);
      
      // Open the popup window
      const popup = window.open(
        authUrl, 
        'TwitchAuth', 
        'width=600,height=800,resizable=yes,scrollbars=yes,status=yes'
      );
      
      // Check if popup was blocked
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        reject(new Error('The popup window was blocked. Please allow popups for this site.'));
        return;
      }
      
      // Function to handle messages from the popup window
      const receiveMessage = async function(event) {
        // Verify the origin for security
        if (event.origin !== window.location.origin) {
          return;
        }
        
        console.log("Received message from popup:", event.data);
        
        // Check if the data contains a token
        if (event.data.type === 'TWITCH_AUTH' && event.data.token) {
          // Remove event listeners
          window.removeEventListener('message', receiveMessage);
          
          // Verify the state for security
          if (event.data.state !== state) {
            reject(new Error('Invalid state, possible CSRF attempt'));
            return;
          }
          
          try {
            // Get user information
            const userData = await getUserInfo(event.data.token);
            
            // Store token and user data with expiry (default to 1 hour)
            const expiry = new Date();
            expiry.setHours(expiry.getHours() + 1); // Token typically valid for 1 hour
            
            localStorage.setItem(STORAGE_KEY_TOKEN, event.data.token);
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
            localStorage.setItem(STORAGE_KEY_EXPIRY, expiry.toISOString());
            
            // Resolve the promise with token and user data
            resolve({
              token: event.data.token,
              userData: userData
            });
          } catch (error) {
            reject(error);
          }
        }
      };
      
      // Listen for messages from the popup window
      window.addEventListener('message', receiveMessage);
      
      // Periodically check if the window has been closed without completing auth
      const popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheckInterval);
          window.removeEventListener('message', receiveMessage);
          reject(new Error('Authentication cancelled'));
        }
      }, 1000);
    });
  };
  
  /**
   * Get user information
   * @param {string} token - Twitch access token
   * @returns {Promise<Object>} - User information
   */
  async function getUserInfo(token) {
    try {
      const clientId = window._TWITCH_CLIENT_ID;
      if (!clientId) {
        throw new Error('Twitch Client ID is not available');
      }
      
      const response = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error retrieving user information');
      }
      
      const data = await response.json();
      return data.data[0]; // Twitch returns an array, but we only need the first element
    } catch (error) {
      console.error('Error retrieving user information:', error);
      throw error;
    }
  }
  
  /**
   * Validate a token
   * @param {string} token - Token to validate
   * @returns {Promise<boolean>} - true if the token is valid
   */
  window.validateTwitchToken = async function(token) {
    try {
      const response = await fetch('https://id.twitch.tv/oauth2/validate', {
        headers: {
          'Authorization': `OAuth ${token}`
        }
      });
      
      if (response.ok) {
        // Update token expiry
        const data = await response.json();
        if (data.expires_in) {
          const expiry = new Date();
          expiry.setSeconds(expiry.getSeconds() + data.expires_in);
          localStorage.setItem(STORAGE_KEY_EXPIRY, expiry.toISOString());
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  };
  
  /**
   * Get the stored authentication data
   * @returns {Object|null} - Authentication data or null if not authenticated
   */
  window.getTwitchAuth = function() {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEY_EXPIRY);
    
    if (token && expiry && new Date(expiry) > new Date()) {
      try {
        const userData = JSON.parse(localStorage.getItem(STORAGE_KEY_USER));
        return {
          token: token,
          userData: userData
        };
      } catch (error) {
        console.warn('Error parsing stored user data:', error);
      }
    }
    
    return null;
  };
  
  /**
   * Log out user by revoking the token
   * @param {string} token - Token to revoke
   * @returns {Promise<boolean>} - true if logout was successful
   */
  window.logoutFromTwitch = async function(token) {
    try {
      const clientId = window._TWITCH_CLIENT_ID;
      if (!clientId) {
        throw new Error('Twitch Client ID is not available');
      }
      
      if (!token) {
        token = localStorage.getItem(STORAGE_KEY_TOKEN);
      }
      
      if (token) {
        const response = await fetch(`https://id.twitch.tv/oauth2/revoke?client_id=${clientId}&token=${token}`, {
          method: 'POST'
        });
        
        // Clear stored data regardless of the response
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_EXPIRY);
        
        return response.ok;
      }
      
      return false;
    } catch (error) {
      console.error('Error during logout:', error);
      
      // Clear stored data even if there's an error
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_EXPIRY);
      
      return false;
    }
  };

  // Initialize - log if Twitch client ID is available
  console.log('Twitch authentication client loaded. Client ID available:', !!TWITCH_CLIENT_ID);
})();

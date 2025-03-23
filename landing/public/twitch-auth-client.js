/**
 * Twitch Authentication Client
 * This script handles Twitch authentication flows and provides utility functions
 * for interacting with the Twitch API.
 */

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
      // First show a loading modal to indicate the process has started
      const modalOverlay = document.createElement('div');
      modalOverlay.id = 'twitch-auth-modal';
      modalOverlay.style.position = 'fixed';
      modalOverlay.style.top = '0';
      modalOverlay.style.left = '0';
      modalOverlay.style.width = '100%';
      modalOverlay.style.height = '100%';
      modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      modalOverlay.style.backdropFilter = 'blur(5px)';
      modalOverlay.style.zIndex = '9999';
      modalOverlay.style.display = 'flex';
      modalOverlay.style.justifyContent = 'center';
      modalOverlay.style.alignItems = 'center';
      
      const modalContent = document.createElement('div');
      modalContent.style.backgroundColor = '#18181b';
      modalContent.style.borderRadius = '8px';
      modalContent.style.padding = '2rem';
      modalContent.style.boxShadow = '0 0 20px rgba(157, 0, 255, 0.5)';
      modalContent.style.textAlign = 'center';
      modalContent.style.color = 'white';
      modalContent.style.maxWidth = '90%';
      modalContent.style.width = '400px';
      
      // Add logo
      const logoDiv = document.createElement('div');
      logoDiv.style.marginBottom = '1.5rem';
      logoDiv.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.41 33.9L3.3 27.79V5.5H32.11V21.79L25.36 28.54H19.14L14.57 33.11H9.41V33.9Z" fill="#9146FF"/>
          <path d="M7.94 9.99H11.03V19.21H7.94V9.99Z" fill="white"/>
          <path d="M19.05 9.99H22.14V19.21H19.05V9.99Z" fill="white"/>
        </svg>
      `;
      
      const title = document.createElement('h2');
      title.textContent = 'Twitch Authentication';
      title.style.marginBottom = '1rem';
      
      const statusDiv = document.createElement('div');
      statusDiv.id = 'twitch-auth-status';
      
      // Add spinner and text
      const spinnerStyle = document.createElement('style');
      spinnerStyle.textContent = `
        @keyframes twitch-auth-spin {
          to { transform: rotate(360deg); }
        }
        #twitch-auth-spinner {
          display: inline-block;
          width: 30px;
          height: 30px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #9146FF;
          animation: twitch-auth-spin 1s ease-in-out infinite;
          margin-bottom: 15px;
        }
      `;
      document.head.appendChild(spinnerStyle);
      
      const spinner = document.createElement('div');
      spinner.id = 'twitch-auth-spinner';
      
      const loadingText = document.createElement('p');
      loadingText.textContent = 'Connecting to Twitch...';
      
      statusDiv.appendChild(spinner);
      statusDiv.appendChild(loadingText);
      
      // Add cancel button
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.marginTop = '20px';
      cancelButton.style.padding = '8px 16px';
      cancelButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      cancelButton.style.color = 'white';
      cancelButton.style.border = 'none';
      cancelButton.style.borderRadius = '4px';
      cancelButton.style.cursor = 'pointer';
      
      cancelButton.addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
        reject(new Error('Authentication cancelled by user'));
      });
      
      statusDiv.appendChild(cancelButton);
      
      // Add elements to modal
      modalContent.appendChild(logoDiv);
      modalContent.appendChild(title);
      modalContent.appendChild(statusDiv);
      
      // Add modal to page
      modalOverlay.appendChild(modalContent);
      document.body.appendChild(modalOverlay);
      
      // Ensure we have a client ID
      const clientId = window._TWITCH_CLIENT_ID;
      if (!clientId) {
        document.body.removeChild(modalOverlay);
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
            document.body.removeChild(modalOverlay);
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
      const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${encodeURIComponent(scopes.join(' '))}&state=${state}&force_verify=true`;
      
      console.log("Opening auth URL:", authUrl);
      
      // Create global variable to track auth window
      window.twitchAuthWindow = null;
      
      // Function to handle messages from the popup window
      const messageHandler = async function(event) {
        // Verify the origin for security
        if (event.origin !== window.location.origin) {
          return;
        }
        
        // Only process valid auth messages
        if (event.data && typeof event.data === 'object' && event.data.type === 'TWITCH_AUTH' && event.data.token) {
          console.log("Received valid auth message:", event.data);
          
          // Remove event listener immediately to prevent double processing
          window.removeEventListener('message', messageHandler);
          
          // Close auth window if it's still open
          if (window.twitchAuthWindow && !window.twitchAuthWindow.closed) {
            window.twitchAuthWindow.close();
          }
          
          // Verify the state for security
          if (event.data.state !== state) {
            statusDiv.innerHTML = `
              <p style="color: #f14669; margin-bottom: 15px;">Security Error</p>
              <p>Invalid state parameter, possible CSRF attempt.</p>
              <button id="twitch-auth-close" style="margin-top: 15px; padding: 8px 16px; background-color: #9146FF; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
            `;
            
            document.getElementById('twitch-auth-close').addEventListener('click', function() {
              document.body.removeChild(modalOverlay);
            });
            
            reject(new Error('Invalid state, possible CSRF attempt'));
            return;
          }
          
          try {
            // Add cleanup function first
            window.cleanupTwitchAuth = function() {
              if (document.body.contains(modalOverlay)) {
                document.body.removeChild(modalOverlay);
              }
              
              // Clear message handler
              if (window.twitchAuthMessageHandler) {
                window.removeEventListener('message', window.twitchAuthMessageHandler);
                delete window.twitchAuthMessageHandler;
              }
              
              // Close auth window if it's still open
              if (window.twitchAuthWindow && !window.twitchAuthWindow.closed) {
                window.twitchAuthWindow.close();
                window.twitchAuthWindow = null;
              }
            };
            // Update status
            statusDiv.innerHTML = `
              <div id="twitch-auth-spinner"></div>
              <p>Fetching user information...</p>
            `;
            
            // Get user information
            const userData = await getUserInfo(event.data.token);
            
            // Store token and user data with expiry (default to 1 hour)
            const expiry = new Date();
            expiry.setHours(expiry.getHours() + 1); // Token typically valid for 1 hour
            
            localStorage.setItem(STORAGE_KEY_TOKEN, event.data.token);
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
            localStorage.setItem(STORAGE_KEY_EXPIRY, expiry.toISOString());
            
            // Remove modal after success
            window.cleanupTwitchAuth();
            
            // Resolve the promise with token and user data
            resolve({
              token: event.data.token,
              userData: userData
            });
          } catch (error) {
            console.error('Error handling authentication:', error);
            
            statusDiv.innerHTML = `
              <p style="color: #f14669; margin-bottom: 15px;">Authentication Error</p>
              <p>${error.message || 'Failed to complete authentication'}</p>
              <button id="twitch-auth-close" style="margin-top: 15px; padding: 8px 16px; background-color: #9146FF; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
            `;
            
            document.getElementById('twitch-auth-close').addEventListener('click', function() {
              document.body.removeChild(modalOverlay);
            });
            
            reject(error);
          }
        }
      };
      
      // Listen for messages from the popup window
      window.addEventListener('message', messageHandler);
      
      // Store the message handler on window for cleanup
      window.twitchAuthMessageHandler = messageHandler;
      
      // Update status to opening auth window
      loadingText.textContent = 'Opening Twitch authentication window...';
      
      // Try to open the window after a short delay to give the modal time to render
      setTimeout(() => {
        // Try to open a new window
        try {
          window.twitchAuthWindow = window.open(
            authUrl,
            'TwitchAuth',
            'width=800,height=700,left=200,top=200,resizable=yes,scrollbars=yes,status=yes,toolbar=yes,menubar=yes,location=yes'
          );
          
          if (!window.twitchAuthWindow || window.twitchAuthWindow.closed || typeof window.twitchAuthWindow.closed === 'undefined') {
            // Popup blocked
            statusDiv.innerHTML = `
              <p style="color: #f14669; margin-bottom: 15px;">Popup Window Blocked</p>
              <p>Your browser blocked the authentication window. Please allow popups for this site.</p>
              <button id="twitch-auth-retry" style="margin-top: 15px; padding: 8px 16px; background-color: #9146FF; color: white; border: none; border-radius: 4px; cursor: pointer;">Try Again</button>
              <button id="twitch-auth-cancel" style="margin-top: 15px; margin-left: 10px; padding: 8px 16px; background-color: rgba(255,255,255,0.1); color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
            `;
            
            document.getElementById('twitch-auth-retry').addEventListener('click', function() {
              // Replace the current modal content
              document.body.removeChild(modalOverlay);
              // Restart the auth process
              window.loginWithTwitch(scopes).then(resolve).catch(reject);
            });
            
            document.getElementById('twitch-auth-cancel').addEventListener('click', function() {
              document.body.removeChild(modalOverlay);
              reject(new Error('Authentication cancelled by user'));
            });
          } else {
            // Successfully opened window
            loadingText.textContent = 'Twitch authentication window opened. Please complete login there.';
            
            // Check if window is closed periodically
            const checkWindowInterval = setInterval(() => {
              if (window.twitchAuthWindow && window.twitchAuthWindow.closed) {
                clearInterval(checkWindowInterval);
                
                // Remove message handler if it exists
                if (window.twitchAuthMessageHandler) {
                  window.removeEventListener('message', window.twitchAuthMessageHandler);
                }
                
                // Only update the UI if the user hasn't been authenticated yet (message handler hasn't removed the modal)
                if (document.body.contains(modalOverlay)) {
                  // Window closed without completing auth
                  statusDiv.innerHTML = `
                    <p style="color: #f14669; margin-bottom: 15px;">Authentication Cancelled</p>
                    <p>The authentication window was closed.</p>
                    <button id="twitch-auth-retry" style="margin-top: 15px; padding: 8px 16px; background-color: #9146FF; color: white; border: none; border-radius: 4px; cursor: pointer;">Try Again</button>
                    <button id="twitch-auth-close" style="margin-top: 15px; margin-left: 10px; padding: 8px 16px; background-color: rgba(255,255,255,0.1); color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                  `;
                  
                  document.getElementById('twitch-auth-retry').addEventListener('click', function() {
                    // Replace the current modal content
                    document.body.removeChild(modalOverlay);
                    // Restart the auth process
                    window.loginWithTwitch(scopes).then(resolve).catch(reject);
                  });
                  
                  document.getElementById('twitch-auth-close').addEventListener('click', function() {
                    document.body.removeChild(modalOverlay);
                    reject(new Error('Authentication cancelled: window was closed'));
                  });
                }
              }
            }, 1000);
          }
        } catch (err) {
          // Handle any error that occurs when trying to open the window
          console.error('Error opening auth window:', err);
          
          statusDiv.innerHTML = `
            <p style="color: #f14669; margin-bottom: 15px;">Error Opening Window</p>
            <p>${err.message || 'Unknown error opening authentication window'}</p>
            <button id="twitch-auth-close" style="margin-top: 15px; padding: 8px 16px; background-color: #9146FF; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
          `;
          
          document.getElementById('twitch-auth-close').addEventListener('click', function() {
            document.body.removeChild(modalOverlay);
            reject(err);
          });
        }
      }, 500);
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
  
  // Set the client ID function
  window.setTwitchClientId = function(clientId) {
    if (clientId) {
      TWITCH_CLIENT_ID = clientId;
      window._TWITCH_CLIENT_ID = clientId;
      console.log('Twitch Client ID set');
    }
  };

  // Initialize with singleton protection
  if (!window._twitchAuthInitialized) {
    window._twitchAuthInitialized = true;
    console.log('Twitch authentication client loaded. Client ID available:', !!TWITCH_CLIENT_ID);
  }
})();
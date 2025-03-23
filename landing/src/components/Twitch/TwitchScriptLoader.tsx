// landing/src/components/Twitch/TwitchScriptLoader.tsx
import { useEffect, useState } from 'react';
import React from 'react';
import { TWITCH_CONFIG } from '../../../services/twitch/twitch-client';
import { TwitchAuthData } from '../../../services/twitch/twitch-types';
import { getEnv } from '../../utils/env-config';

interface TwitchScriptLoaderProps {
  children: React.ReactNode;
}

/**
 * Enhanced TwitchScriptLoader Component
 * Loads the Twitch authentication script and initializes the environment
 */
const TwitchScriptLoader: React.FC<TwitchScriptLoaderProps> = ({ children }) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Check if script is already loaded or we already have window.loginWithTwitch
    if (window.loginWithTwitch) {
      setScriptLoaded(true);
      return;
    }
  
    const loadScript = () => {
      try {
        // Ensure client ID is available
        const clientId = window.TWITCH_CLIENT_ID || 
                         window.ENV?.TWITCH_CLIENT_ID || 
                         window.ENV?.VITE_TWITCH_CLIENT_ID ||
                         getEnv('TWITCH_CLIENT_ID') ||
                         TWITCH_CONFIG.CLIENT_ID;
        
        if (!clientId) {
          console.error('No Twitch Client ID found. Authentication will likely fail.');
        } else {
          console.log(`TwitchScriptLoader: Using client ID: ${clientId.substring(0, 5)}...`);
        }
        
        // Create script element
        const script = document.createElement('script');
        script.src = '/twitch-auth-client.js';
        script.async = true;
        
        // Set timeout to detect script loading failures
        const timeoutId = setTimeout(() => {
          console.error('Twitch auth script loading timed out');
          setLoadError('Twitch authentication script failed to load (timeout)');
        }, 10000); // 10 second timeout
        
        script.onload = () => {
          clearTimeout(timeoutId);
          console.log('Twitch auth client script loaded successfully');
          
          // Additional check to verify the script actually loaded the expected functions
          if (!window.loginWithTwitch) {
            console.error('Script loaded but loginWithTwitch function is missing');
            setLoadError('Twitch authentication not initialized correctly');
            return;
          }
          
          // Set the client ID if not already set
          if (!window.TWITCH_CLIENT_ID && clientId) {
            window.TWITCH_CLIENT_ID = clientId;
            console.log('Set TWITCH_CLIENT_ID in window:', window.TWITCH_CLIENT_ID);
          } else if (window.TWITCH_CLIENT_ID) {
            console.log('TWITCH_CLIENT_ID already set in window:', window.TWITCH_CLIENT_ID);
          }
          
          // If window.setTwitchClientId exists, use it too
          if (window.setTwitchClientId && clientId) {
            window.setTwitchClientId(clientId);
            console.log('Called setTwitchClientId with:', clientId);
          }
          
          setScriptLoaded(true);
        };
        
        script.onerror = () => {
          clearTimeout(timeoutId);
          console.error('Failed to load Twitch auth client script');
          setLoadError('Failed to load Twitch authentication script');
        };
        
        document.body.appendChild(script);
      } catch (err) {
        console.error('Error loading Twitch auth script:', err);
        setLoadError('Error initializing Twitch authentication');
      }
    };
  
    loadScript();
  
    // Cleanup function - we don't remove the script as it's needed globally
  }, []);

  if (loadError) {
    return (
      <div className="p-4 bg-red-900/30 border border-red-500 text-red-200 rounded">
        {loadError}
      </div>
    );
  }

  if (!scriptLoaded) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-electric-blue"></div>
        <span className="ml-2">Loading Twitch integration...</span>
      </div>
    );
  }

  return <>{children}</>;
};

// Add window augmentation for TypeScript
declare global {
  interface Window {
    loginWithTwitch?: (scopes: string[]) => Promise<TwitchAuthData>;
    validateTwitchToken?: (token: string) => Promise<boolean>;
    logoutFromTwitch?: (token?: string) => Promise<boolean>;
    getTwitchAuth?: () => TwitchAuthData | null;
    setTwitchClientId?: (clientId: string) => void;
    TWITCH_CLIENT_ID?: string;
    ENV?: Record<string, string>;
  }
}

export default TwitchScriptLoader;
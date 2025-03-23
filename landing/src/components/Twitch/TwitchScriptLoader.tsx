import { useEffect, useState } from 'react';
import React from 'react';
import { TWITCH_CONFIG } from '../../../services/twitch/twitch-client';

interface TwitchScriptLoaderProps {
  children: React.ReactNode;
}

/**
 * TwitchScriptLoader Component
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
        // Create script element
        const script = document.createElement('script');
        script.src = '/twitch-auth-client.js';
        script.async = true;
        
        script.onload = () => {
          console.log('Twitch auth client script loaded successfully');
          
          // Set the client ID if not already set
          if (!window.TWITCH_CLIENT_ID && TWITCH_CONFIG.CLIENT_ID) {
            window.TWITCH_CLIENT_ID = TWITCH_CONFIG.CLIENT_ID;
            console.log('Set TWITCH_CLIENT_ID from config:', window.TWITCH_CLIENT_ID);
          } else if (window.TWITCH_CLIENT_ID) {
            console.log('TWITCH_CLIENT_ID already set in window');
          }
          
          // If window.setTwitchClientId exists, use it too
          if (window.setTwitchClientId && TWITCH_CONFIG.CLIENT_ID) {
            window.setTwitchClientId(TWITCH_CONFIG.CLIENT_ID);
          }
          
          setScriptLoaded(true);
        };
        
        script.onerror = () => {
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
    loginWithTwitch?: (scopes: string[]) => Promise<any>;
    validateTwitchToken?: (token: string) => Promise<boolean>;
    logoutFromTwitch?: (token?: string) => Promise<boolean>;
    getTwitchAuth?: () => any;
    setTwitchClientId?: (clientId: string) => void;
    TWITCH_CLIENT_ID?: string;
  }
}

export default TwitchScriptLoader;
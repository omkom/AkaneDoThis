// src/components/TwitchScriptLoader.tsx
import { useEffect, useState } from 'react';
import { getEnv, setupEnvironment } from '../utils/env-config';
import React from 'react';

interface TwitchScriptLoaderProps {
  children: React.ReactNode;
}

const TwitchScriptLoader: React.FC<TwitchScriptLoaderProps> = ({ children }) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize environment variables first
    setupEnvironment({
      // You can provide a fallback client ID here for development
      // Replace with your actual Twitch client ID
      TWITCH_CLIENT_ID: "udrg080q6g8t7qbhgo67x0ytt08otn" // Demo/placeholder client ID
    });

    // Check if script is already loaded
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
          // Manually set TWITCH_CLIENT_ID from env if needed
          if (!window.TWITCH_CLIENT_ID) {
            window.TWITCH_CLIENT_ID = getEnv('TWITCH_CLIENT_ID', '');
            console.log('Set TWITCH_CLIENT_ID from env:', window.TWITCH_CLIENT_ID);
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

    // Cleanup function
    return () => {
      // We don't remove the script on unmount because it's needed globally
    };
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

export default TwitchScriptLoader;

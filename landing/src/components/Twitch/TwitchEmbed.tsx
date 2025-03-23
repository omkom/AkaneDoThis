// src/components/Twitch/TwitchEmbed.tsx
import { trackClick } from '../../utils/analytics';
import React, { useEffect, useRef, useState } from 'react';

// Define props interface for the component
interface TwitchEmbedProps {
  channel: string;
  width?: string | number;
  height?: string | number;
  autoplay?: boolean;
  muted?: boolean;
  theme?: 'light' | 'dark';
  parent?: string[];
  className?: string;
  onReady?: () => void;
  onPlay?: () => void;
  onOffline?: () => void;
}

// Extend Window interface to include Twitch
declare global {
  interface Window {
    Twitch?: {
      Embed: new (
        id: string, 
        options: {
          width: string | number;
          height: string | number;
          channel: string;
          autoplay?: boolean;
          muted?: boolean;
          theme?: 'light' | 'dark';
          parent?: string[];
          layout?: string;
        }
      ) => {
        addEventListener: (event: string, callback: () => void) => void;
        getPlayer: () => any;
      };
      Player: {
        READY: string;
        PLAY: string;
        OFFLINE: string;
      };
    };
  }
}

/**
 * TwitchEmbed Component
 * Renders a Twitch stream embed with proper loading and error handling
 */
const TwitchEmbed: React.FC<TwitchEmbedProps> = ({
  channel,
  width = '100%',
  height = '100%',
  autoplay = true,
  muted = false,
  theme = 'dark',
  parent = [],
  className = '',
  onReady,
  onPlay,
  onOffline
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [embedId] = useState(`twitch-embed-${Math.random().toString(36).substring(2, 9)}`);
  const embedRef = useRef<any>(null);

  // Load the Twitch Embed API script
  useEffect(() => {
    // Skip if already loaded
    if (window.Twitch) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://embed.twitch.tv/embed/v1.js';
    script.async = true;
    script.onload = () => {
      setIsLoaded(true);
    };
    script.onerror = () => {
      setError('Failed to load Twitch embed script');
    };

    document.body.appendChild(script);

    return () => {
      // Clean up script if component unmounts during loading
      if (!script.onload) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Initialize the embed once the script is loaded
  useEffect(() => {
    if (!isLoaded || !window.Twitch || !containerRef.current) return;

    try {
      // Add the current domain as a parent if not provided
      const domains = [...parent];
      if (domains.length === 0) {
        const hostname = window.location.hostname;
        domains.push(hostname);
        // Also add localhost for development
        if (hostname !== 'localhost' && process.env.NODE_ENV === 'development') {
          domains.push('localhost');
        }
      }

      // Create the embed
      embedRef.current = new window.Twitch.Embed(embedId, {
        width,
        height,
        channel,
        autoplay,
        muted,
        theme,
        parent: domains,
        layout: 'video'
      });

      // Add event listeners
      if (onReady) {
        embedRef.current.addEventListener(window.Twitch.Player.READY, onReady);
      }
      
      if (onPlay) {
        embedRef.current.addEventListener(window.Twitch.Player.PLAY, onPlay);
      }
      
      if (onOffline) {
        embedRef.current.addEventListener(window.Twitch.Player.OFFLINE, onOffline);
      }
    } catch (err) {
      console.error('Error initializing Twitch embed:', err);
      setError(`Error initializing Twitch embed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Cleanup function
    return () => {
      // Remove event listeners if they were added and the embed exists
      if (embedRef.current) {
        if (onReady && window.Twitch) {
          embedRef.current.removeEventListener(window.Twitch.Player.READY, onReady);
        }
        if (onPlay && window.Twitch) {
          embedRef.current.removeEventListener(window.Twitch.Player.PLAY, onPlay);
        }
        if (onOffline && window.Twitch) {
          embedRef.current.removeEventListener(window.Twitch.Player.OFFLINE, onOffline);
        }
      }
    };
  }, [isLoaded, channel, width, height, autoplay, muted, theme, parent, onReady, onPlay, onOffline, embedId]);

  if (error) {
    return (
      <div 
        className={`bg-black/50 flex items-center justify-center text-red-400 border border-red-500 rounded ${className}`}
        style={{ width, height, minHeight: '200px' }}
      >
        <div className="p-4 text-center">
          <p>{error}</p>
          <p className="text-sm mt-2">
            Please try refreshing the page or watch on{' '}
            <a 
              href={`https://twitch.tv/${channel}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-electric-blue hover:underline"
            >
              Twitch
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className={`bg-black/50 flex items-center justify-center ${className}`}
        style={{ width, height, minHeight: '200px' }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-electric-blue"></div>
      </div>
    );
  }

  // Track when user clicks the embed (to track engagement)
  const handleEmbedClick = () => {
    trackClick('twitch', 'embed-click');
  };

  return (
    <div 
      ref={containerRef} 
      className={`twitch-embed-container ${className}`} 
      style={{ width, height }}
      onClick={handleEmbedClick}
    >
      <div id={embedId} style={{ width, height }}></div>
      
      {/* Add a subtle neon border overlay to match the cyberpunk theme */}
      <div className="absolute inset-0 pointer-events-none border-2 border-neon-pink/30 z-10"></div>
      <div className="absolute inset-0 pointer-events-none border border-electric-blue/20 z-10"></div>
    </div>
  );
};

export default TwitchEmbed;
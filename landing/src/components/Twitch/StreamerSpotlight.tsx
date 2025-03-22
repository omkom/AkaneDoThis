import React, { useState, useEffect } from 'react';
import { FaTwitch, FaPlay, FaInfoCircle, FaUsers, FaHeart } from 'react-icons/fa';

// Using the same interfaces from TwitchHeroOverlay
interface TwitchStats {
  [x: string]: string | number | boolean | undefined | string[];
  followerCount: number;
  subscriberCount: number;
  isLive: boolean;
  viewerCount: number;
  streamTitle: string;
  startedAt?: string;
  thumbnail_url?: string;
  tags?: string[];
}

interface TwitchUserData {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  view_count: number;
  created_at: string;
}

interface TwitchAuthData {
  token: string;
  userData: TwitchUserData;
}

// Declare global types for Twitch API functions like in TwitchHeroOverlay
declare global {
  interface Window {
    loginWithTwitch?: (scopes: string[]) => Promise<TwitchAuthData>;
    validateTwitchToken?: (token: string) => Promise<boolean>;
    logoutFromTwitch?: (token?: string) => Promise<boolean>;
    getTwitchAuth?: () => TwitchAuthData | null;
    TWITCH_CLIENT_ID?: string;
  }
}

const StreamerSpotlight: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [twitchStats, setTwitchStats] = useState<TwitchStats>({
    followerCount: 0,
    subscriberCount: 0,
    isLive: false,
    viewerCount: 0,
    streamTitle: '',
    thumbnail_url: '',
    tags: []
  });
  
  // Match the constants from the existing TwitchHeroOverlay
  let BROADCASTER_ID = '';
  const CHANNEL_NAME = 'akanedothis';
  
  // Fetch channel info on component mount
  useEffect(() => {
    const fetchStreamInfo = async () => {
      setIsLoading(true);
      try {
        // First check if we have existing auth
        if (typeof window !== 'undefined' && window.getTwitchAuth) {
          const storedAuth = window.getTwitchAuth();
          if (storedAuth) {
            await fetchTwitchData(storedAuth.token);
          } else {
            // Fallback to public data when not authenticated
            fetchChannelInfo();
          }
        } else {
          // Also fallback when no auth methods available
          fetchChannelInfo();
        }
      } catch (err) {
        console.error('Error fetching stream info:', err);
        setError('Failed to load stream data');
        // Fallback to basic info on error
        fetchChannelInfo();
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreamInfo();
  }, []);
  
// Function to fetch channel info when user is not authenticated
const fetchChannelInfo = async () => {
    try {
        // Try to get a client credentials token if available, otherwise use public endpoints
        const clientToken = await getClientCredentialsToken();
        
        if (clientToken) {
            // If we have a token, use the same API call pattern as fetchTwitchData
            await fetchTwitchData(clientToken);
        } else {
            // Fallback to basic data if we can't get a token
            console.warn('No client credentials token available, using fallback data');
        }
    } catch (err) {
        console.error('Error fetching channel info:', err);
        setError('Failed to load channel data');
    }
};

// Helper function to get a client credentials token
const getClientCredentialsToken = async (): Promise<string | null> => {
    try {
        // Check if we have a client credentials endpoint or function in our app
        if (typeof window !== 'undefined' && window.TWITCH_CLIENT_ID) {
            // This would typically be a call to your backend that securely handles client secret
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
        }
        return null;
    } catch (err) {
        console.error('Error getting client credentials token:', err);
        return null;
    }
};
  
  // Function to fetch Twitch data when user is authenticated - from TwitchHeroOverlay
  const fetchTwitchData = async (token: string) => {
    try {
      // Fetch stream info
      const streamResponse = await fetch(`https://api.twitch.tv/helix/streams?user_login=${CHANNEL_NAME}`, {
        headers: {
          'Client-ID': window.TWITCH_CLIENT_ID || '',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (streamResponse.ok) {
        interface StreamData {
          data: Array<{
            user_id: string;
            viewer_count: number;
            title: string;
            started_at: string;
            thumbnail_url: string;
            game_name: string;
            tags: string[];
          }>;
        }
        
        const streamData: StreamData = await streamResponse.json();
        const isLive = streamData.data && streamData.data.length > 0;
        
        // Calculate duration if live
        let startedAt: string | undefined;
        if (isLive && streamData.data[0]?.started_at) {
          startedAt = streamData.data[0].started_at;
        }
        
        // Set broadcaster ID if we have stream data
        if (isLive && streamData.data[0]) {
            BROADCASTER_ID = streamData.data[0].user_id;
        }
        //console.log(streamData)
        
        // Update stats with stream data
        setTwitchStats(prev => ({
          ...prev,
          isLive: isLive,
          viewerCount: isLive ? streamData.data[0].viewer_count : 0,
          streamTitle: isLive ? streamData.data[0].title : prev.streamTitle,
          startedAt: startedAt,
          thumbnail_url: isLive ? streamData.data[0].thumbnail_url.replace('{width}x{height}','300x300')  : '',
          video:    isLive ? streamData.data[0].thumbnail_url.replace('{width}x{height}','300x300')  : '', 
          tags: isLive ? streamData.data[0].tags : []
      }));

      
      // Fetch follower count
      const followersResponse = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${BROADCASTER_ID}`, {
        headers: {
          'Client-ID': window.TWITCH_CLIENT_ID || '',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (followersResponse.ok) {
        const followersData = await followersResponse.json();
        setTwitchStats(prev => ({
          ...prev,
          followerCount: followersData.total || 0,
          subscriberCount: followersData.total || 0
        }));
      }
    
    }
      
    } catch (err) {
      console.error('Error fetching Twitch data:', err);
      // Fallback to basic info
      fetchChannelInfo();
    }
  };

  // Format numbers (e.g., 1.2K, 3.4M)
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Format stream duration
  const getStreamDuration = (startedAt?: string) => {
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
  };

  // Handle click on the main CTA
  const handleWatchClick = () => {
    window.open(`https://twitch.tv/${CHANNEL_NAME}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="streamer-spotlight-container rounded-lg backdrop-blur-sm border border-neon-pink p-4 md:p-6 animate-pulse">
        <div className="h-6 w-24 bg-neon-pink/30 rounded mb-2"></div>
        <div className="h-4 w-32 bg-electric-blue/30 rounded mb-4"></div>
        <div className="h-10 w-full bg-neon-pink/20 rounded"></div>
      </div>
    );
  }

  return (
    <div className="streamer-spotlight-container w-full max-w-md mx-auto mt-6">
      <div className={`neo-card ${twitchStats.isLive ? 'neo-card-pink' : 'neo-card-purple'} p-4 md:p-6 rounded-lg backdrop-blur-sm relative overflow-hidden`}>
        {/* Status badge */}
        {twitchStats.isLive ? (
          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-600 to-neon-pink px-3 py-1 text-white text-sm font-cyber rounded-bl-lg rounded-tr-lg flex items-center">
            <span className="relative flex h-3 w-3 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            LIVE NOW
          </div>
        ) : (
          <div className="absolute -top-1 -right-1 bg-gray-700 px-3 py-1 text-gray-300 text-sm font-cyber rounded-bl-lg rounded-tr-lg">
            OFFLINE
          </div>
        )}

        {/* Twitch logo and streamer name */}
        <div className="flex items-center mb-3">
          <FaTwitch className={`${twitchStats.isLive ? 'text-neon-pink' : 'text-bright-purple'} mr-2`} size={20} />
          <h4 className={`font-cyber ${twitchStats.isLive ? 'text-neon-pink' : 'text-bright-purple'}`}>{CHANNEL_NAME}</h4>
        </div>

        {/* Stats row */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center text-electric-blue">
            <FaUsers className="mr-1" size={14} />
            <span className="text-sm">{formatNumber(twitchStats.followerCount)} followers</span>
          </div>
          {twitchStats.isLive && (
            <div className="flex items-center text-vivid-lime">
              <FaUsers className="mr-1" size={14} />
              <span className="text-sm">{formatNumber(twitchStats.viewerCount)} Viewers</span>
            </div>
          )}
        </div>

        {/* Stream info (when live) */}
        {twitchStats.isLive && twitchStats.streamTitle && (
          <div className="mb-4">
            <h5 className="text-white text-sm font-semibold line-clamp-1">{twitchStats.streamTitle}</h5>
            {twitchStats.startedAt && (
             
              <div className="flex items-center text-gray-400 text-xs mt-1">
                <FaPlay className="mr-1" size={10} />
                <span>En Live depuis {getStreamDuration(twitchStats.startedAt)}</span>
              </div>
              
            )}
          </div>
        )}

        {/* Call to action button */}
        <button 
          onClick={handleWatchClick}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-cyber text-base rounded-md transition-all ${
            twitchStats.isLive 
              ? 'bg-neon-pink text-black hover:bg-neon-pink/90 animate-[pulse_2s_infinite]' 
              : 'bg-bright-purple/20 border border-bright-purple text-white hover:bg-bright-purple/30'
          }`}
        >
          {twitchStats.isLive ? (
            <>
              <FaPlay /> Regarder
            </>
          ) : (
            <>
              <FaInfoCircle /> Les anciens Streams
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StreamerSpotlight;

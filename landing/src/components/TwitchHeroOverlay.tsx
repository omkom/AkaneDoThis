import React, { useState, useEffect } from 'react';
import { FaTwitch, FaHeart, FaStar, FaUsers, FaPlay, FaBell } from 'react-icons/fa';
import { trackClick } from '../utils/analytics';

// Define TypeScript interfaces
interface TwitchStats {
  followerCount: number;
  subscriberCount: number;
  isLive: boolean;
  viewerCount: number;
  streamTitle: string;
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

// Declare global types for Twitch API functions
declare global {
  interface Window {
    loginWithTwitch?: (scopes: string[]) => Promise<TwitchAuthData>;
    validateTwitchToken?: (token: string) => Promise<boolean>;
    logoutFromTwitch?: (token?: string) => Promise<boolean>;
    getTwitchAuth?: () => TwitchAuthData | null;
    TWITCH_CLIENT_ID?: string;
  }
}

const TwitchHeroOverlay: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authData, setAuthData] = useState<TwitchAuthData | null>(null);
  const [twitchStats, setTwitchStats] = useState<TwitchStats>({
    followerCount: 0,
    subscriberCount: 0,
    isLive: false,
    viewerCount: 0,
    streamTitle: ''
  });
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Mock broadcaster ID for AkaneDoThis
  const BROADCASTER_ID = '258e0f7f-cdd0-4ab8-89f2-82d97993f474'; // Replace with actual ID
  const CHANNEL_NAME = 'akanedothis';

  // Check for existing authentication on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (typeof window !== 'undefined' && window.getTwitchAuth) {
          const storedAuth = window.getTwitchAuth();
          if (storedAuth) {
            setAuthData(storedAuth);
            setIsAuthenticated(true);
            await fetchTwitchData(storedAuth.token, storedAuth.userData.id);
            checkIsFollowing(storedAuth.token, storedAuth.userData.id, BROADCASTER_ID);
          } else {
            // Just fetch public data
            fetchChannelInfo();
          }
        } else {
          fetchChannelInfo();
        }
      } catch (err) {
        console.error('Error initializing Twitch data:', err);
        setError('Failed to load Twitch data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Function to fetch channel info when user is not authenticated
  const fetchChannelInfo = async () => {
    try {
      // This would normally be an API call to your backend
      // For now, using mock data
      setTwitchStats({
        followerCount: 8754,
        subscriberCount: 342,
        isLive: true,
        viewerCount: 267,
        streamTitle: 'Cyberpunk 2077 - Phantom Liberty | REDmod Showcase + Q&A'
      });
    } catch (err) {
      console.error('Error fetching channel info:', err);
      setError('Failed to load channel information');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch Twitch data when user is authenticated
  const fetchTwitchData = async (token: string, userId: string) => {
    try {
      // Fetch stream info
      const streamResponse = await fetch(`https://api.twitch.tv/helix/streams?user_login=${CHANNEL_NAME}`, {
        headers: {
          'Client-ID': window.TWITCH_CLIENT_ID || '',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (streamResponse.ok) {
        const streamData = await streamResponse.json();
        const isLive = streamData.data && streamData.data.length > 0;
        
        // Update stats with stream data
        setTwitchStats(prev => ({
          ...prev,
          isLive: isLive,
          viewerCount: isLive ? streamData.data[0].viewer_count : 0,
          streamTitle: isLive ? streamData.data[0].title : prev.streamTitle
        }));
      }
      
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
          followerCount: followersData.total || 0
        }));
      }
      
      // This endpoint requires additional scopes or might not be available
      // For demonstration purposes, we're using mock data
      setTwitchStats(prev => ({
        ...prev,
        subscriberCount: 342
      }));
      
    } catch (err) {
      console.error('Error fetching Twitch data:', err);
      setError('Failed to load Twitch data');
    }
  };

  // Function to check if the user is following the channel
  const checkIsFollowing = async (token: string, userId: string, broadcasterId: string) => {
    try {
      const response = await fetch(
        `https://api.twitch.tv/helix/channels/followers?user_id=${userId}&broadcaster_id=${broadcasterId}`,
        {
          headers: {
            'Client-ID': window.TWITCH_CLIENT_ID || '',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.data && data.data.length > 0);
      }
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
  };

  // Function to handle login
  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (typeof window !== 'undefined' && window.loginWithTwitch) {
        const auth = await window.loginWithTwitch(['user:read:follows', 'user:read:subscriptions']);
        setAuthData(auth);
        setIsAuthenticated(true);
        await fetchTwitchData(auth.token, auth.userData.id);
        checkIsFollowing(auth.token, auth.userData.id, BROADCASTER_ID);
        
        // Track login
        trackClick('twitch', 'login');
      } else {
        throw new Error('Twitch authentication function not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!authData) {
      handleLogin();
      return;
    }
    
    // This is a mock implementation
    // In a real app, you would call the Twitch API to follow/unfollow
    setIsFollowing(!isFollowing);
    
    // Track follow/unfollow
    trackClick('twitch', isFollowing ? 'unfollow' : 'follow');
  };

  // Function to handle watch now button click
  const handleWatchClick = () => {
    window.open(`https://twitch.tv/${CHANNEL_NAME}`, '_blank');
    trackClick('twitch', 'watch');
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="twitch-hero-overlay absolute bottom-4 right-4 max-w-sm z-20">
      <div className="neo-card neo-card-purple card-3d p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <FaTwitch className="text-neon-cyan mr-2" size={20} />
            <h4 className="font-cyber text-neon-cyan">Twitch Status</h4>
          </div>
          {!isAuthenticated && (
            <button 
              onClick={handleLogin}
              disabled={isLoading}
              className="px-3 py-1 bg-neon-cyan/20 border border-neon-cyan rounded text-white text-sm hover:bg-neon-cyan/30 transition"
            >
              {isLoading ? 'Loading...' : 'Connect'}
            </button>
          )}
        </div>
        
        {error ? (
          <div className="text-red-400 text-sm mb-2">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <div className="flex items-center justify-center text-neon-pink mb-1">
                  <FaUsers className="mr-1" />
                  <span className="font-cyber">{formatNumber(twitchStats.followerCount)}</span>
                </div>
                <div className="text-xs text-gray-400">Followers</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center text-electric-blue mb-1">
                  <FaStar className="mr-1" />
                  <span className="font-cyber">{formatNumber(twitchStats.subscriberCount)}</span>
                </div>
                <div className="text-xs text-gray-400">Subscribers</div>
              </div>
              <div className="text-center">
                {twitchStats.isLive ? (
                  <>
                    <div className="flex items-center justify-center text-vivid-lime mb-1">
                      <FaPlay className="mr-1" />
                      <span className="font-cyber">{formatNumber(twitchStats.viewerCount)}</span>
                    </div>
                    <div className="text-xs text-gray-400">Viewers</div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center text-gray-400 mb-1">
                      <FaBell className="mr-1" />
                      <span className="font-cyber">Offline</span>
                    </div>
                    <div className="text-xs text-gray-400">Status</div>
                  </>
                )}
              </div>
            </div>
            
            {twitchStats.isLive && (
              <div className="mb-3">
                <div className="px-2 py-1 bg-red-600 text-white text-xs rounded mb-1 inline-block">LIVE</div>
                <p className="text-sm text-white line-clamp-1">{twitchStats.streamTitle}</p>
              </div>
            )}
            
            <div className="flex gap-2">
              <button 
                onClick={handleFollowToggle}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-cyber ${
                  isFollowing 
                    ? 'bg-bright-purple/10 text-bright-purple border border-bright-purple' 
                    : 'bg-bright-purple text-white'
                } rounded hover:bg-bright-purple/30 transition`}
              >
                <FaHeart />
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button 
                onClick={handleWatchClick}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-cyber bg-neon-cyan text-black rounded hover:bg-neon-cyan/80 transition"
              >
                <FaPlay /> 
                Watch Now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TwitchHeroOverlay;
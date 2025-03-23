import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaTwitch, FaPlay, FaUsers, FaStar, FaHeart, FaRegHeart } from 'react-icons/fa';
import { trackClick } from '../../utils/analytics';

// Import Twitch services
import {
  getChannelData,
  checkFollowing,
  followChannel,
  unfollowChannel
} from '../../../services/twitch';

import {
  TwitchAuthData,
  TwitchChannelData,
} from '../../../services/twitch/twitch-types';

import {
  formatNumber,
  getStreamDuration,
  getTwitchChannelUrl,
} from '../../../services/twitch/twitch-client';

// Default channel name
const DEFAULT_CHANNEL_NAME = 'akanedothis';

// Cache constants
const CACHE_TIMES = {
  CHANNEL_DATA: 60000, // 1 minute
  FOLLOW_STATUS: 300000, // 5 minutes
  LIVE_REFRESH: 30000, // 30 seconds for live data
  MIN_REFRESH: 10000, // Minimum time between API refreshes
};

interface StreamerSpotlightProps {
  channelName?: string;
}

/**
 * StreamerSpotlight Component
 * Displays Twitch streamer information with subscription and follow functionality
 */
const StreamerSpotlight: React.FC<StreamerSpotlightProps> = ({
  channelName = DEFAULT_CHANNEL_NAME
}) => {
  // State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authData, setAuthData] = useState<TwitchAuthData | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<boolean>(false);
  const [channelData, setChannelData] = useState<Partial<TwitchChannelData>>({
    broadcaster: null,
    stream: null,
    channel: null,
    followers: { total: 0, data: [] },
    isLive: false,
    subscriberCount: 0,
    stats: {
      followerCount: 0,
      viewerCount: 0,
      streamTitle: '',
      game: '',
      startedAt: null,
      thumbnailUrl: null,
      tags: []
    }
  });

  // Refs to track state without triggering rerenders
  const authDataRef = useRef<TwitchAuthData | null>(null);
  const channelDataRef = useRef<Partial<TwitchChannelData>>(channelData);
  const isInitialLoadRef = useRef<boolean>(true);
  const lastFetchTimeRef = useRef<number>(0);

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== 'undefined' && window.getTwitchAuth) {
        try {
          const storedAuth = window.getTwitchAuth();
          if (storedAuth) {
            // Validate token before using
            const isValid = await window.validateTwitchToken?.(storedAuth.token);
            if (isValid) {
              setAuthData(storedAuth);
              authDataRef.current = storedAuth;
            }
          }
        } catch (err) {
          console.error("Error validating token:", err);
        }
      }
    };

    checkAuth();
  }, []);

  // Function to throttle API calls
  const throttledFetch = useCallback(async (fetchFn: () => Promise<void>) => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current >= CACHE_TIMES.MIN_REFRESH) {
      lastFetchTimeRef.current = now;
      await fetchFn();
    }
  }, []);

  // Function to check follow status
  const checkFollowStatus = useCallback(async (token: string, userId: string, broadcasterId: string) => {
    if (!broadcasterId || !userId) return;

    try {
      const followStatus = await checkFollowing(userId, broadcasterId, token);
      setIsFollowing(followStatus);
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
  }, []);

  // Function to fetch channel data
  const fetchChannelData = useCallback(async (forceRefresh = false) => {
    // Use throttled fetch except on initial load or forced refresh
    if (!isInitialLoadRef.current && !forceRefresh) {
      return throttledFetch(async () => {
        await fetchChannelData(true);
      });
    }

    setIsLoading(isInitialLoadRef.current); // Only show loading on initial load
    setError(null);

    try {
      // Get user token if available
      const userToken = authDataRef.current?.token;

      // Fetch channel data with user token if available
      const data = await getChannelData(channelName, userToken);

      setChannelData(data);
      channelDataRef.current = data;

      // Check follow status if authenticated
      if (authDataRef.current?.token && data.broadcaster?.id) {
        await checkFollowStatus(
          authDataRef.current.token,
          authDataRef.current.userData.id,
          data.broadcaster.id
        );
      }

      // Clear any errors on successful fetch
      setError(null);
    } catch (err) {
      console.error('Error fetching channel data:', err);

      if (isInitialLoadRef.current) {
        // Only show error on initial load
        setError('Failed to load channel data');

        // Set fallback data
        const fallbackData = {
          broadcaster: null,
          stream: null,
          channel: null,
          followers: { total: 0, data: [] },
          isLive: false,
          subscriberCount: 534, // Fallback count
          stats: {
            followerCount: 8754, // Fallback data
            viewerCount: 0,
            streamTitle: 'Check out our Twitch channel!',
            game: '',
            startedAt: null,
            thumbnailUrl: null,
            tags: []
          }
        };

        setChannelData(fallbackData);
        channelDataRef.current = fallbackData;
      }
    } finally {
      if (isInitialLoadRef.current) {
        setIsLoading(false);
        isInitialLoadRef.current = false;
      }
    }
  }, [channelName, checkFollowStatus, throttledFetch]);

  // Fetch data on mount and when auth changes
  useEffect(() => {
    // Update auth ref
    authDataRef.current = authData;

    // Fetch data immediately
    fetchChannelData(true);

    // Set up refresh interval
    const refreshInterval = setInterval(() => {
      if (!document.hidden) {
        // Only refresh if page is visible
        fetchChannelData(false);
      }
    }, channelData.isLive ? CACHE_TIMES.LIVE_REFRESH : CACHE_TIMES.CHANNEL_DATA);

    // Refresh data when visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchChannelData(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authData, fetchChannelData, channelData.isLive]);

  // Show login dialog
  const showLoginPopup = () => {
    if (typeof window !== 'undefined' && window.loginWithTwitch) {
      window.loginWithTwitch([
        'user:read:follows',
        'user:edit:follows',
        'channel:read:subscriptions'
      ]).then(newAuth => {
        setAuthData(newAuth);
        // Refresh data with new auth
        fetchChannelData(true);
      }).catch(err => {
        console.error('Login error:', err);
        setError('Authentication failed');
      });
    }
  };

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!authData) {
      showLoginPopup();
      return;
    }

    if (!channelData.broadcaster) {
      setError('Cannot follow: broadcaster information not available');
      return;
    }

    setFollowLoading(true);

    try {
      const userId = authData.userData.id;
      const token = authData.token;
      const broadcasterId = channelData.broadcaster.id;

      let success = false;
      if (isFollowing) {
        success = await unfollowChannel(userId, broadcasterId, token);
      } else {
        success = await followChannel(userId, broadcasterId, true, token);
      }

      if (success) {
        setIsFollowing(!isFollowing);
        // Track event
        trackClick('twitch', isFollowing ? 'unfollow' : 'follow');
      } else {
        throw new Error(`Failed to ${isFollowing ? 'unfollow' : 'follow'} channel`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  // Handle watch button click
  const handleWatchClick = () => {
    window.open(getTwitchChannelUrl(channelName), '_blank');
    trackClick('twitch', 'watch');
  };

  // Extract values from channel data
  const { isLive, stats, subscriberCount } = channelData;

  // Create a fixed-height container for content
  const minHeight = "200px";

  // Loading state
  if (isLoading) {
    return (
      <div className="streamer-spotlight-container w-full max-w-md mx-auto mt-6" style={{ minHeight }}>
        <div className="neo-card neo-card-purple p-4 md:p-6 rounded-lg backdrop-blur-sm animate-pulse h-full">
          <div className="h-6 w-24 bg-neon-pink/30 rounded mb-2"></div>
          <div className="h-4 w-32 bg-electric-blue/30 rounded mb-4"></div>
          <div className="h-10 w-full bg-neon-pink/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="streamer-spotlight-container w-full max-w-md mx-auto mt-6" style={{ minHeight }}>
      <div className={`neo-card ${isLive ? 'neo-card-pink' : 'neo-card-purple'} p-4 md:p-6 rounded-lg backdrop-blur-sm relative overflow-hidden`}>
        {/* Status badge */}
        <div className="absolute -top-1 -right-1 px-3 py-1 text-sm font-cyber rounded-bl-lg rounded-tr-lg h-7 flex items-center">
          {isLive ? (
            <div className="bg-gradient-to-r from-red-600 to-neon-pink text-white flex items-center">
              <span className="relative flex h-3 w-3 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              LIVE NOW
            </div>
          ) : (
            <div className="bg-gray-700 text-gray-300">
              OFFLINE
            </div>
          )}
        </div>

        {/* Twitch logo and streamer name */}
        <div className="flex items-center mb-3">
          <FaTwitch className={`${isLive ? 'text-neon-pink' : 'text-bright-purple'} mr-2`} size={20} />
          <h4 className={`font-cyber ${isLive ? 'text-neon-pink' : 'text-bright-purple'}`}>{channelName}</h4>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3 h-14">
          <div className="text-center">
            <div className="flex items-center justify-center text-neon-pink mb-1">
              <FaUsers className="mr-1" />
              <span className="font-cyber">{formatNumber(stats?.followerCount)}</span>
            </div>
            <div className="text-xs text-gray-400">Followers</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-electric-blue mb-1">
              <FaStar className="mr-1" />
              <span className="font-cyber">{formatNumber(subscriberCount || 0)}</span>
            </div>
            <div className="text-xs text-gray-400">Subscribers</div>
          </div>
          <div className="text-center">
            {isLive ? (
              <>
                <div className="flex items-center justify-center text-vivid-lime mb-1">
                  <FaPlay className="mr-1" />
                  <span className="font-cyber">{formatNumber(stats?.viewerCount)}</span>
                </div>
                <div className="text-xs text-gray-400">Status</div>
              </>
            ) : (
              <div className="text-xs text-gray-400">Offline</div>
            )}
          </div>
        </div>

        {/* Stream info */}
        <div className="mb-4 min-h-12">
          <h5 className="text-white text-sm font-semibold line-clamp-1">
            {stats?.streamTitle || 'Check out our Twitch channel!'}
          </h5>
          {stats?.game && (
            <div className="text-gray-300 text-xs mt-1">Playing: {stats.game}</div>
          )}
          {isLive && stats?.startedAt && (
            <div className="flex items-center text-gray-400 text-xs mt-1">
              <FaPlay className="mr-1" size={10} />
              <span>Live for {getStreamDuration(stats.startedAt)}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 h-10">
          {/* Follow/Unfollow button */}
          <button
            onClick={handleFollowToggle}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-cyber ${
              isFollowing
                ? 'bg-bright-purple/10 text-bright-purple border border-bright-purple'
                : 'bg-bright-purple text-white'
            } rounded hover:bg-bright-purple/30 transition`}
          >
            {followLoading ? (
              <span className="flex items-center">
                <div className="w-3 h-3 border-t-2 border-bright-purple rounded-full animate-spin mr-1"></div>
                Loading...
              </span>
            ) : (
              <>
                {isFollowing ? <FaHeart /> : <FaRegHeart />}
                {isFollowing ? 'Following' : 'Follow'}
              </>
            )}
          </button>

          {/* Watch button */}
          <button
            onClick={handleWatchClick}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-cyber ${
              isLive
                ? 'bg-neon-pink text-black hover:bg-neon-pink/90 animate-[pulse_2s_infinite]'
                : 'bg-electric-blue/20 border border-electric-blue text-white hover:bg-electric-blue/30'
            } rounded transition`}
          >
            <FaPlay />
            {isLive ? 'Watch Now' : 'View Channel'}
          </button>
        </div>

        {/* Error message if any */}
        <div className="min-h-6 mt-3">
          {error && (
            <div className="p-2 bg-red-900/30 border border-red-500 text-red-200 rounded text-xs">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamerSpotlight;

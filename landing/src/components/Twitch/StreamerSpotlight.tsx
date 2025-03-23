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

import {
  getStoredAuth,
  validateToken
} from '../../../services/twitch/twitch-auth';

// Default channel name if none is provided
const DEFAULT_CHANNEL_NAME = 'akanedothis';

// Throttle function to prevent excessive API calls
function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
  };
}

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
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [showAuthPopup, setShowAuthPopup] = useState<boolean>(false);
  
  // Refs to prevent rerendering and keep track of previous state
  const authDataRef = useRef<TwitchAuthData | null>(null);
  const channelDataRef = useRef<Partial<TwitchChannelData>>(channelData);
  const isInitialLoadRef = useRef<boolean>(true);
  const lastAuthCheckRef = useRef<number>(0);
  const lastFollowCheckRef = useRef<number>(0);
  const lastFetchRef = useRef<number>(0);
  
  // Throttled API functions
  const throttledCheckFollowing = useCallback(
    throttle(async (token: string, userId: string, broadcasterId: string) => {
      if (!broadcasterId || !userId) return;
      
      try {
        // Record time of check
        lastFollowCheckRef.current = Date.now();
        
        const isFollowing = await checkFollowing(userId, broadcasterId);
        setIsFollowing(isFollowing);
      } catch (err) {
        console.error('Error checking follow status:', err);
      }
    }, 10000), // Only check follow status once every 10 seconds max
    []
  );
  
  // Check for existing authentication on component mount - only once
  useEffect(() => {
    const checkAuth = async () => {
      // Don't check auth if we already did recently
      const now = Date.now();
      if (now - lastAuthCheckRef.current < 30000) return; // 30 second cooldown
      
      lastAuthCheckRef.current = now;
      const storedAuth = getStoredAuth();
      
      if (storedAuth) {
        // Only validate if we don't already have auth data
        if (!authDataRef.current) {
          try {
            const isValid = await validateToken(storedAuth.token);
            if (isValid) {
              setAuthData(storedAuth);
              authDataRef.current = storedAuth;
              
              // Check follow status only if we have broadcaster data
              if (channelDataRef.current?.broadcaster) {
                throttledCheckFollowing(
                  storedAuth.token, 
                  storedAuth.userData.id, 
                  channelDataRef.current.broadcaster.id
                );
              }
            }
          } catch (err) {
            console.error("Error validating token:", err);
          }
        }
      }
    };
    
    checkAuth();
  }, []); // Empty dependency array - run only once on mount
  
  // Check follow status when either auth data or broadcaster changes - but avoid circular updates
  useEffect(() => {
    // Update refs
    authDataRef.current = authData;
    channelDataRef.current = channelData;
    
    if (authData?.token && channelData?.broadcaster?.id) {
      // Only check if we haven't done so recently
      const now = Date.now();
      if (now - lastFollowCheckRef.current > 10000) { // 10 second cooldown
        throttledCheckFollowing(
          authData.token,
          authData.userData.id,
          channelData.broadcaster.id
        );
      }
    }
  }, [authData, channelData?.broadcaster?.id, throttledCheckFollowing]);
  
  // Show the auth popup
  const showLoginPopup = () => {
    setShowAuthPopup(true);
    
    // Create a modal dialog for the auth popup
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'twitch-auth-overlay';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    modalOverlay.style.backdropFilter = 'blur(5px)';
    modalOverlay.style.zIndex = '9999';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    
    // Create content for the popup
    const authContent = document.createElement('div');
    authContent.className = 'auth-content';
    authContent.style.backgroundColor = 'rgba(25, 25, 35, 0.9)';
    authContent.style.borderRadius = '8px';
    authContent.style.padding = '20px';
    authContent.style.textAlign = 'center';
    authContent.style.maxWidth = '400px';
    authContent.style.boxShadow = '0 0 20px rgba(157, 0, 255, 0.5)';
    authContent.style.border = '1px solid rgba(157, 0, 255, 0.3)';
    
    authContent.innerHTML = `
      <div style="margin-bottom: 15px;">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.41 33.9L3.3 27.79V5.5H32.11V21.79L25.36 28.54H19.14L14.57 33.11H9.41V33.9Z" fill="#9146FF"/>
          <path d="M7.94 9.99H11.03V19.21H7.94V9.99Z" fill="white"/>
          <path d="M19.05 9.99H22.14V19.21H19.05V9.99Z" fill="white"/>
        </svg>
      </div>
      <h3 style="color: white; margin-bottom: 15px; font-weight: bold;">Connect to Twitch</h3>
      <p style="color: rgba(255,255,255,0.8); margin-bottom: 20px;">Authentication is required to follow channels and view subscriber information</p>
      <button id="proceed-auth" style="background-color: #9146FF; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Connect</button>
      <button id="cancel-auth" style="background-color: rgba(255,255,255,0.1); color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Cancel</button>
    `;
    
    modalOverlay.appendChild(authContent);
    document.body.appendChild(modalOverlay);
    
    // Close modal on outside click
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        document.body.removeChild(modalOverlay);
        setShowAuthPopup(false);
      }
    });
    
    // Handle proceed button click
    document.getElementById('proceed-auth')?.addEventListener('click', () => {
      handleLogin();
    });
    
    // Handle cancel button click
    document.getElementById('cancel-auth')?.addEventListener('click', () => {
      document.body.removeChild(modalOverlay);
      setShowAuthPopup(false);
    });
  };
  
  // Function to handle login
  const handleLogin = async () => {
    setError(null);
    
    try {
      if (typeof window !== 'undefined' && window.loginWithTwitch) {
        const authContent = document.querySelector('#twitch-auth-overlay .auth-content');
        if (authContent) {
          authContent.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; flex-direction: column;">
              <div class="spinner" style="border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top: 3px solid #9146FF; width: 30px; height: 30px; animation: spin 1s linear infinite; margin-bottom: 15px;"></div>
              <p style="color: white;">Connecting to Twitch...</p>
            </div>
            <style>
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          `;
        }
        
        // Include needed scopes
        const auth = await window.loginWithTwitch([
          'user:read:follows',
          'user:edit:follows',
          'channel:read:subscriptions'
        ]);
        
        if (!auth || !auth.token) {
          throw new Error('No authentication token received');
        }
        
        // Update state and ref
        setAuthData(auth);
        authDataRef.current = auth;
        
        // Check follow status only if we have broadcaster data
        if (channelDataRef.current?.broadcaster) {
          throttledCheckFollowing(
            auth.token,
            auth.userData.id,
            channelDataRef.current.broadcaster.id
          );
        }
        
        // Track login
        trackClick('twitch', 'login-spotlight');
        
        // Close the popup
        const overlay = document.getElementById('twitch-auth-overlay');
        if (overlay) {
          document.body.removeChild(overlay);
        }
        setShowAuthPopup(false);
      } else {
        throw new Error('Twitch authentication function not available');
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Authentication error';
      setError(errorMessage);
      
      // Show the error in the popup
      const overlay = document.getElementById('twitch-auth-overlay');
      if (overlay) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'auth-error';
        errorDiv.style.backgroundColor = 'rgba(220, 38, 38, 0.9)';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '20px';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.maxWidth = '400px';
        errorDiv.style.textAlign = 'center';
        
        errorDiv.innerHTML = `
          <h3 style="font-weight: bold; margin-bottom: 10px;">Twitch Authentication Error</h3>
          <p>${errorMessage}</p>
          <button id="close-auth-error" style="margin-top: 15px; padding: 5px 15px; background-color: rgba(255,255,255,0.2); border: none; border-radius: 4px; cursor: pointer;">Close</button>
        `;
        
        overlay.innerHTML = '';
        overlay.appendChild(errorDiv);
        
        // Close on button click
        document.getElementById('close-auth-error')?.addEventListener('click', () => {
          document.body.removeChild(overlay);
          setShowAuthPopup(false);
        });
      }
    }
  };

  // Function to handle follow/unfollow
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
  
  // Fetch channel data - optimized to avoid excessive dependencies and rerenders
  const fetchChannelData = useCallback(async () => {
    // Implement throttling to prevent excessive API calls
    const now = Date.now();
    if (!isInitialLoadRef.current && now - lastFetchRef.current < 30000) {
      return; // Don't fetch more than once every 30 seconds for refreshes
    }
    lastFetchRef.current = now;
    
    // Only show loading on initial load
    if (isInitialLoadRef.current) {
      setIsLoading(true);
      setError(null);
    }
    
    try {
      // Use the service to get all channel data
      const data = await getChannelData(channelName);
      
      if (isInitialLoadRef.current) {
        // Full update on initial load
        setChannelData(data);
        
        // Estimate subscriber count based on broadcaster type
        if (data.broadcaster) {
          let subCount = 0;
          
          if (data.broadcaster.broadcaster_type === 'partner') {
            subCount = Math.floor(Math.random() * 2000) + 500;
          } else if (data.broadcaster.broadcaster_type === 'affiliate') {
            subCount = Math.floor(Math.random() * 300) + 50;
          }
          
          setSubscriberCount(subCount);
        }
        
        // After initial load, set ref to false
        isInitialLoadRef.current = false;
      } else {
        // For refreshes, only update certain fields to minimize re-renders
        // Check if live status changed
        if (data.isLive !== channelDataRef.current.isLive) {
          setChannelData(prevData => ({
            ...prevData,
            isLive: data.isLive,
            stream: data.stream,
            stats: {
              ...prevData.stats,
              viewerCount: data.stats?.viewerCount || 0,
              streamTitle: data.stats?.streamTitle || prevData.stats?.streamTitle || '',
              startedAt: data.stats?.startedAt || null,
              game: data.stats?.game || prevData.stats?.game || ''
            }
          }));
        } else if (data.isLive) {
          // Only update viewer count and other dynamic fields
          setChannelData(prevData => ({
            ...prevData,
            stats: {
              ...prevData.stats,
              viewerCount: data.stats?.viewerCount || 0
            }
          }));
        }
        
        // Selectively update broadcaster and follower data if it changed
        if (data.broadcaster?.id !== channelDataRef.current.broadcaster?.id ||
            data.followers?.total !== channelDataRef.current.followers?.total) {
          setChannelData(prevData => ({
            ...prevData,
            broadcaster: data.broadcaster || prevData.broadcaster,
            followers: data.followers || prevData.followers,
            stats: {
              ...prevData.stats,
              followerCount: data.stats?.followerCount || prevData.stats?.followerCount || 0
            }
          }));
        }
      }
      
      // Clear any errors on successful fetch
      if (error) setError(null);
      
      // Update the ref after successful fetch
      channelDataRef.current = data;
      
      // Check follow status only if authenticated and not checked recently
      if (authDataRef.current?.token && data.broadcaster?.id) {
        const now = Date.now();
        if (now - lastFollowCheckRef.current > 10000) { // 10 second cooldown
          throttledCheckFollowing(
            authDataRef.current.token,
            authDataRef.current.userData.id,
            data.broadcaster.id
          );
        }
      }
    } catch (err) {
      console.error('Error fetching channel data:', err);
      
      if (isInitialLoadRef.current) {
        // Only show error and fallback data on initial load
        setError('Failed to load channel data');
        
        // Set fallback data so UI doesn't break
        setChannelData({
          broadcaster: null,
          stream: null,
          channel: null,
          followers: { total: 0, data: [] },
          isLive: false,
          stats: {
            followerCount: 8754, // Fallback data
            viewerCount: 0,
            streamTitle: 'Check out our Twitch channel!',
            game: '',
            startedAt: null,
            thumbnailUrl: null,
            tags: []
          }
        });
        setSubscriberCount(342); // Fallback subscriber count
      }
    } finally {
      // Only update loading state on initial load
      if (isInitialLoadRef.current) {
        setIsLoading(false);
      }
    }
  }, [channelName, error, throttledCheckFollowing]); // Minimal dependencies

  // Fetch data on component mount and set refresh interval
  useEffect(() => {
    fetchChannelData();
    
    // Refresh data every 60 seconds when tab is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchChannelData();
      }
    }, 60000);
    
    // Add visibility change listener to refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // When tab becomes visible, only fetch if it's been more than 30 seconds
        const now = Date.now();
        if (now - lastFetchRef.current > 30000) {
          fetchChannelData();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clean up auth overlay if it exists
      const overlay = document.getElementById('twitch-auth-overlay');
      if (overlay && document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    };
  }, [fetchChannelData]);

  // Handle click on the watch button
  const handleWatchClick = () => {
    window.open(getTwitchChannelUrl(channelName), '_blank');
    trackClick('twitch', 'watch');
  };

  // Extract values from channel data
  const { isLive, stats } = channelData;

  // Create a fixed-height container for content to prevent layout shifts
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
        {/* Status badge - fixed size and position to prevent layout shift */}
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

        {/* Stats row - fixed height to prevent layout shift */}
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
              <span className="font-cyber">{formatNumber(subscriberCount)}</span>
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
                <div className="text-xs text-gray-400">Viewers</div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center text-gray-400 mb-1">
                  <FaTwitch className="mr-1" />
                  <span className="font-cyber">Offline</span>
                </div>
                <div className="text-xs text-gray-400">Status</div>
              </>
            )}
          </div>
        </div>

        {/* Stream info - fixed height to prevent layout shift */}
        <div className="mb-4 min-h-12">
          <h5 className="text-white text-sm font-semibold line-clamp-1">
            {stats?.streamTitle || 'Check out our Twitch channel!'}
          </h5>
          {stats?.game && (
            <div className="text-gray-300 text-xs mt-1">
              Playing: {stats.game}
            </div>
          )}
          {isLive && stats?.startedAt && (
            <div className="flex items-center text-gray-400 text-xs mt-1">
              <FaPlay className="mr-1" size={10} />
              <span>En Live depuis {getStreamDuration(stats.startedAt)}</span>
            </div>
          )}
        </div>

        {/* Action buttons - Watch and Follow */}
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

        {/* Error message if any - fixed height container */}
        <div className="min-h-6 mt-3">
          {error && (
            <div className="p-2 bg-red-900/30 border border-red-500 text-red-200 rounded text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Login prompt if not authenticated - preserved space for layout consistency */}
        <div className="min-h-10 mt-1">
          {!authData && !error && (
            <div className="mt-2 p-2 bg-bright-purple/10 border border-bright-purple/30 rounded text-xs flex items-center justify-between">
              <span className="text-bright-purple">Sign in with Twitch for more features</span>
              <button 
                onClick={showLoginPopup}
                className="text-white bg-bright-purple/30 px-2 py-1 rounded text-xs hover:bg-bright-purple/50"
              >
                Connect
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamerSpotlight;
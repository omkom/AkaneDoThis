import React, { useState, useEffect, useCallback } from 'react';
import { FaTwitch, FaPlay, FaInfoCircle, FaUsers } from 'react-icons/fa';
import { getChannelData, TwitchChannelData } from '../../../services/twitch/twitch-api';
import { getBestAvailableToken } from '../../../services/twitch/twitch-auth';
import { TWITCH_CONFIG, formatNumber, getStreamDuration, getTwitchChannelUrl } from '../../../services/twitch/twitch-client';

/**
 * StreamerSpotlight Component
 * Displays Twitch streamer information including live status, viewers, and followers
 */
const StreamerSpotlight: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [channelData, setChannelData] = useState<TwitchChannelData>({
    broadcaster: {
      id: '',
      login: '',
      display_name: '',
      type: '',
      broadcaster_type: '',
      description: '',
      profile_image_url: '',
      offline_image_url: '',
      view_count: 0,
      created_at: ''
    },
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
  
  // Channel constants
  const CHANNEL_NAME = TWITCH_CONFIG.CHANNEL_NAME;
  
  // Fetch channel data
  const fetchData = useCallback(async () => {
    try {
      // Ensure we have the latest token
      await getBestAvailableToken();
      
      // Get all channel data
      const data = await getChannelData(CHANNEL_NAME);
      setChannelData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching channel data:', err);
      setError('Failed to load channel data');
    } finally {
      setIsLoading(false);
    }
  }, [CHANNEL_NAME]);

  // Fetch data on component mount and set refresh interval
  useEffect(() => {
    fetchData();
    
    // Refresh data every 60 seconds when tab is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchData();
      }
    }, 60000);
    
    // Add visibility change listener to refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  // Handle click on the watch button
  const handleWatchClick = () => {
    window.open(getTwitchChannelUrl(CHANNEL_NAME), '_blank');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="streamer-spotlight-container rounded-lg backdrop-blur-sm border border-neon-pink p-4 md:p-6 animate-pulse">
        <div className="h-6 w-24 bg-neon-pink/30 rounded mb-2"></div>
        <div className="h-4 w-32 bg-electric-blue/30 rounded mb-4"></div>
        <div className="h-10 w-full bg-neon-pink/20 rounded"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="streamer-spotlight-container rounded-lg backdrop-blur-sm border border-red-500 p-4 md:p-6">
        <div className="text-red-400">{error}</div>
        <button 
          onClick={() => {
            setIsLoading(true);
            fetchData();
          }}
          className="mt-2 px-4 py-2 bg-red-800 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // Extract values from channel data
  const { isLive, stats } = channelData;
  
  return (
    <div className="streamer-spotlight-container w-full max-w-md mx-auto mt-6">
      <div className={`neo-card ${isLive ? 'neo-card-pink' : 'neo-card-purple'} p-4 md:p-6 rounded-lg backdrop-blur-sm relative overflow-hidden`}>
        {/* Status badge */}
        {isLive ? (
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
          <FaTwitch className={`${isLive ? 'text-neon-pink' : 'text-bright-purple'} mr-2`} size={20} />
          <h4 className={`font-cyber ${isLive ? 'text-neon-pink' : 'text-bright-purple'}`}>{CHANNEL_NAME}</h4>
        </div>

        {/* Stats row */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center text-electric-blue">
            <FaUsers className="mr-1" size={14} />
            <span className="text-sm">{formatNumber(stats.followerCount)} followers</span>
          </div>
          {isLive && (
            <div className="flex items-center text-vivid-lime">
              <FaUsers className="mr-1" size={14} />
              <span className="text-sm">{formatNumber(stats.viewerCount)} Viewers</span>
            </div>
          )}
        </div>

        {/* Stream info */}
        <div className="mb-4">
          <h5 className="text-white text-sm font-semibold line-clamp-1">
            {stats.streamTitle || 'Check out our Twitch channel!'}
          </h5>
          {stats.game && (
            <div className="text-gray-300 text-xs mt-1">
              Playing: {stats.game}
            </div>
          )}
          {isLive && stats.startedAt && (
            <div className="flex items-center text-gray-400 text-xs mt-1">
              <FaPlay className="mr-1" size={10} />
              <span>En Live depuis {getStreamDuration(stats.startedAt)}</span>
            </div>
          )}
        </div>

        {/* Call to action button */}
        <button 
          onClick={handleWatchClick}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-cyber text-base rounded-md transition-all ${
            isLive 
              ? 'bg-neon-pink text-black hover:bg-neon-pink/90 animate-[pulse_2s_infinite]' 
              : 'bg-bright-purple/20 border border-bright-purple text-white hover:bg-bright-purple/30'
          }`}
        >
          {isLive ? (
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
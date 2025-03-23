// landing/src/components/Twitch/TwitchIntegration.tsx
import React, { useState, useEffect } from 'react';
import { FaTwitch, FaExternalLinkAlt, FaEye, FaHeart, FaRegHeart, FaCalendarAlt } from 'react-icons/fa';
import TwitchScriptLoader from './TwitchScriptLoader';
import { 
  TwitchUserData, 
  TwitchAuthData, 
  TwitchStream, 
  TwitchScheduleSegment, 
  TwitchEvent 
} from '../../../services/twitch/twitch-types';
import {
  getBroadcasterByLogin,
  checkFollowing,
  followChannel,
  unfollowChannel,
  getStreamInfo,
  getChannelSchedule
} from '../../../services/twitch/twitch-api';
import {
  formatNumber,
  formatThumbnailUrl,
  getTwitchChannelUrl
} from '../../../services/twitch/twitch-client';

const TwitchIntegration: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authData, setAuthData] = useState<TwitchAuthData | null>(null);
  const [events, setEvents] = useState<TwitchEvent[]>([]);
  const [isFollowing, setIsFollowing] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      // Safely access window object in a way that works with SSR
      if (typeof window !== 'undefined' && window.getTwitchAuth) {
        const storedAuth = window.getTwitchAuth();
        if (storedAuth) {
          setAuthData(storedAuth);
          
          // Validate token before using it
          try {
            const isValid = await window.validateTwitchToken?.(storedAuth.token);
            if (isValid) {
              fetchEvents(storedAuth.token, storedAuth.userData.id);
            } else {
              // Token is invalid, log out
              await window.logoutFromTwitch?.();
              setAuthData(null);
              setError("Your Twitch session has expired. Please log in again.");
            }
          } catch (err) {
            console.error("Error validating token:", err);
            setError("Failed to validate your Twitch session.");
          }
        }
      }
    };
    
    checkAuth();
  }, []);

  // Function to handle login
  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (typeof window !== 'undefined' && window.loginWithTwitch) {
        const auth = await window.loginWithTwitch([
          'user:read:follows',
          'user:read:subscriptions',
          'user:edit:follows'
        ]);
        
        setAuthData(auth);
        fetchEvents(auth.token, auth.userData.id);
      } else {
        throw new Error('Twitch authentication function not available');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle logout
  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      if (typeof window !== 'undefined' && window.logoutFromTwitch && authData) {
        await window.logoutFromTwitch(authData.token);
        setAuthData(null);
        setEvents([]);
        setIsFollowing({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during logout');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch Twitch events (live streams and scheduled events)
  const fetchEvents = async (token: string, userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch live streams first
      const streamsResponse = await fetch(`/api/twitch/streams?userId=${userId}`);
      
      if (!streamsResponse.ok) {
        throw new Error('Failed to fetch live streams');
      }
      
      const streamsData = await streamsResponse.json();
      
      // Transform stream data
      const liveEvents: TwitchEvent[] = (streamsData.data || []).map((stream: TwitchStream) => ({
        type: 'live',
        id: stream.id,
        broadcaster_id: stream.user_id,
        broadcaster_name: stream.user_name,
        title: stream.title,
        game_name: stream.game_name,
        thumbnail_url: stream.thumbnail_url,
        viewer_count: stream.viewer_count,
        started_at: stream.started_at
      }));
      
      // Set events to live streams first
      setEvents(liveEvents);
      
      // Then try to fetch scheduled events if we have a user token
      try {
        const scheduleResponse = await fetch(`/api/twitch/schedule?userId=${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          
          // Transform schedule data
          const scheduledEvents: TwitchEvent[] = (scheduleData.segments || []).map((segment: TwitchScheduleSegment) => ({
            type: 'scheduled',
            id: segment.id,
            broadcaster_id: segment.broadcaster_id,
            broadcaster_name: segment.broadcaster_name,
            title: segment.title,
            category: segment.category?.name,
            start_time: segment.start_time,
            end_time: segment.end_time
          }));
          
          // Combine live and scheduled events
          const allEvents = [...liveEvents, ...scheduledEvents];
          setEvents(allEvents);
          
          // Fetch follow status for each broadcaster
          const followStatus: Record<string, boolean> = {};
          
          // Create a unique list of broadcaster IDs
          const broadcasterIds = Array.from(new Set(allEvents.map(event => event.broadcaster_id)));
          
          // Check follow status for each broadcaster
          for (const broadcasterId of broadcasterIds) {
            try {
              const isFollowing = await checkFollowing(userId, broadcasterId);
              followStatus[broadcasterId] = isFollowing;
            } catch (followErr) {
              console.error(`Error checking follow status for ${broadcasterId}:`, followErr);
            }
          }
          
          setIsFollowing(followStatus);
        }
      } catch (scheduleErr) {
        console.error('Error fetching scheduled events:', scheduleErr);
        // We still have live events, so don't set an error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Twitch events');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to toggle follow status for a channel
  const toggleFollow = async (broadcasterId: string, broadcasterName: string, currentlyFollowing: boolean) => {
    if (!authData) return;
    
    setFollowLoading(prev => ({ ...prev, [broadcasterId]: true }));
    
    try {
      const userId = authData.userData.id;
      const token = authData.token;
      
      let success = false;
      if (currentlyFollowing) {
        success = await unfollowChannel(userId, broadcasterId, token);
      } else {
        success = await followChannel(userId, broadcasterId, true, token);
      }
      
      if (success) {
        // Update local follow status
        setIsFollowing(prev => ({
          ...prev,
          [broadcasterId]: !currentlyFollowing
        }));
        
        // Show success message
        setError(null);
      } else {
        throw new Error(`Failed to ${currentlyFollowing ? 'unfollow' : 'follow'} ${broadcasterName}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${currentlyFollowing ? 'unfollow' : 'follow'} ${broadcasterName}`);
    } finally {
      setFollowLoading(prev => ({ ...prev, [broadcasterId]: false }));
    }
  };

  // Function to refresh events
  const refreshEvents = () => {
    if (authData) {
      fetchEvents(authData.token, authData.userData.id);
    }
  };

  // Function to format date/time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate time until stream starts
  const getTimeUntil = (dateString: string) => {
    const now = new Date();
    const streamDate = new Date(dateString);
    const diffMs = streamDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Starting soon";
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `Starts in ${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `Starts in ${diffHours}h ${diffMinutes}m`;
    } else {
      return `Starts in ${diffMinutes} minutes`;
    }
  };

  return (
    <TwitchScriptLoader>
      <div className="twitch-integration neo-card neo-card-purple p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-cyber neon-text purple flex items-center">
            <FaTwitch className="mr-2" /> Twitch Integration
          </h3>
          
          {authData ? (
            <div className="flex items-center">
              <img 
                src={authData.userData.profile_image_url} 
                alt={authData.userData.display_name} 
                className="w-8 h-8 rounded-full mr-2"
              />
              <span className="mr-4">{authData.userData.display_name}</span>
              <button 
                onClick={handleLogout}
                disabled={isLoading}
                className="px-4 py-1 bg-bright-purple/20 border border-bright-purple rounded text-white hover:bg-bright-purple/30 transition"
              >
                Log Out
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              disabled={isLoading}
              className="px-4 py-2 bg-bright-purple text-white hover:bg-neon-pink transition font-cyber"
            >
              {isLoading ? 'Connecting...' : 'Connect with Twitch'}
            </button>
          )}
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 text-red-200 rounded">
            {error}
          </div>
        )}
        
        {authData ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-cyber">Your Twitch Feed</h4>
              <button 
                onClick={refreshEvents}
                disabled={isLoading}
                className="text-sm px-3 py-1 border border-electric-blue rounded text-white hover:bg-electric-blue/20 transition"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {events.length > 0 ? (
              <div className="space-y-4">
                {/* Live Streams Section */}
                {events.filter(e => e.type === 'live').length > 0 && (
                  <div className="mb-2">
                    <h4 className="text-lg font-cyber neon-text pink mb-2">Live Now</h4>
                    {events
                      .filter(event => event.type === 'live')
                      .map(event => (
                        <div key={event.id} className="neo-card neo-card-pink p-4 mb-4">
                          <div className="flex items-start">
                            {event.thumbnail_url && (
                              <div className="w-32 h-18 mr-4 overflow-hidden">
                                <img 
                                  src={formatThumbnailUrl(event.thumbnail_url, 320, 180)} 
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h5 className="font-bold">{event.title}</h5>
                                <span className="px-2 py-1 bg-red-600 text-white text-xs rounded flex items-center">
                                  <FaEye className="mr-1" /> {event.viewer_count?.toLocaleString() || 'LIVE'}
                                </span>
                              </div>
                              <p className="text-sm">
                                <span className="text-gray-400">Streamer:</span> {event.broadcaster_name}
                              </p>
                              
                              {event.game_name && (
                                <p className="text-sm">
                                  <span className="text-gray-400">Playing:</span> {event.game_name}
                                </p>
                              )}
                              
                              <div className="mt-2 flex items-center space-x-2">
                                <a 
                                  href={getTwitchChannelUrl(event.broadcaster_name)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm px-3 py-1 inline-flex items-center border border-neon-pink text-white hover:bg-neon-pink/20 transition rounded"
                                >
                                  Watch Now <FaExternalLinkAlt className="ml-1" size={12} />
                                </a>
                                
                                <button
                                  onClick={() => toggleFollow(
                                    event.broadcaster_id, 
                                    event.broadcaster_name, 
                                    isFollowing[event.broadcaster_id] || false
                                  )}
                                  disabled={followLoading[event.broadcaster_id]}
                                  className="text-sm px-3 py-1 inline-flex items-center border border-electric-blue text-white hover:bg-electric-blue/20 transition rounded"
                                >
                                  {followLoading[event.broadcaster_id] ? (
                                    <span className="flex items-center">
                                      <div className="w-3 h-3 border-t-2 border-electric-blue rounded-full animate-spin mr-1"></div>
                                      Loading...
                                    </span>
                                  ) : isFollowing[event.broadcaster_id] ? (
                                    <span className="flex items-center">
                                      <FaHeart className="mr-1 text-neon-pink" /> Following
                                    </span>
                                  ) : (
                                    <span className="flex items-center">
                                      <FaRegHeart className="mr-1" /> Follow
                                    </span>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                
                {/* Scheduled Streams Section */}
                {events.filter(e => e.type === 'scheduled').length > 0 && (
                  <div>
                    <h4 className="text-lg font-cyber neon-text cyan mb-2">Upcoming Streams</h4>
                    {events
                      .filter(event => event.type === 'scheduled')
                      .sort((a, b) => new Date(a.start_time || '').getTime() - new Date(b.start_time || '').getTime())
                      .map(event => (
                        <div key={event.id} className="neo-card neo-card-blue p-4 mb-4">
                          <div className="flex items-start">
                            <div className="mr-4 text-3xl text-electric-blue">
                              <FaCalendarAlt />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h5 className="font-bold">{event.title}</h5>
                                <span className="px-2 py-1 bg-electric-blue/30 text-white text-xs rounded">
                                  {event.start_time && getTimeUntil(event.start_time)}
                                </span>
                              </div>
                              <p className="text-sm">
                                <span className="text-gray-400">Streamer:</span> {event.broadcaster_name}
                              </p>
                              
                              {event.category && (
                                <p className="text-sm">
                                  <span className="text-gray-400">Category:</span> {event.category}
                                </p>
                              )}
                              
                              {event.start_time && (
                                <p className="text-sm">
                                  <span className="text-gray-400">Time:</span> {formatDate(event.start_time)}
                                </p>
                              )}
                              
                              <div className="mt-2 flex items-center space-x-2">
                                <a 
                                  href={getTwitchChannelUrl(event.broadcaster_name)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm px-3 py-1 inline-flex items-center border border-electric-blue text-white hover:bg-electric-blue/20 transition rounded"
                                >
                                  View Channel <FaExternalLinkAlt className="ml-1" size={12} />
                                </a>
                                
                                <button
                                  onClick={() => toggleFollow(
                                    event.broadcaster_id, 
                                    event.broadcaster_name, 
                                    isFollowing[event.broadcaster_id] || false
                                  )}
                                  disabled={followLoading[event.broadcaster_id]}
                                  className="text-sm px-3 py-1 inline-flex items-center border border-electric-blue text-white hover:bg-electric-blue/20 transition rounded"
                                >
                                  {followLoading[event.broadcaster_id] ? (
                                    <span className="flex items-center">
                                      <div className="w-3 h-3 border-t-2 border-electric-blue rounded-full animate-spin mr-1"></div>
                                      Loading...
                                    </span>
                                  ) : isFollowing[event.broadcaster_id] ? (
                                    <span className="flex items-center">
                                      <FaHeart className="mr-1 text-neon-pink" /> Following
                                    </span>
                                  ) : (
                                    <span className="flex items-center">
                                      <FaRegHeart className="mr-1" /> Follow
                                    </span>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-electric-blue mb-4"></div>
                    <p>Loading your Twitch feed...</p>
                  </div>
                ) : (
                  <div>
                    <p className="mb-4">No live or upcoming streams found from channels you follow.</p>
                    <p className="text-sm text-gray-400">Try following more channels or check back later!</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <FaTwitch className="mx-auto text-5xl text-bright-purple mb-4" />
            <h4 className="text-xl font-cyber mb-2">Connect to Twitch</h4>
            <p className="text-gray-400 mb-6">See live streams and upcoming events from channels you follow</p>
            <button 
              onClick={handleLogin}
              disabled={isLoading}
              className="px-6 py-2 bg-bright-purple text-white hover:bg-neon-pink transition font-cyber"
            >
              {isLoading ? 'Connecting...' : 'Connect with Twitch'}
            </button>
          </div>
        )}
      </div>
    </TwitchScriptLoader>
  );
};

export default TwitchIntegration;
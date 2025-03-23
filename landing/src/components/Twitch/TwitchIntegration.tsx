import React, { useState, useEffect, useCallback } from 'react';
import { FaTwitch, FaExternalLinkAlt, FaEye, FaHeart, FaRegHeart, FaCalendarAlt } from 'react-icons/fa';
import { trackClick } from '../../utils/analytics';
import { 
  TwitchUserData, 
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
import TwitchVIPsList from './TwitchVIPsList';
import { FaCrown } from 'react-icons/fa';

const TwitchIntegration: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<TwitchEvent[]>([]);
  const [isFollowing, setIsFollowing] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  // Global authentication status listener
  useEffect(() => {
    // Check auth on mount
    checkAuthStatus();
    
    // Set up auth check interval
    const authCheckInterval = setInterval(checkAuthStatus, 10000);
    
    // Clean up interval on unmount
    return () => clearInterval(authCheckInterval);
  }, []);
  
  // Centralized auth check function
  const checkAuthStatus = useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !window.getTwitchAuth) return;
      
      const authData = window.getTwitchAuth();
      
      if (authData) {
        // Validate token before using
        const isValid = await window.validateTwitchToken?.(authData.token);
        
        if (isValid) {
          // Token is valid, fetch events
          fetchEvents(authData.token, authData.userData.id);
          return true;
        } else {
          // Token is invalid, log out
          await window.logoutFromTwitch?.();
          setEvents([]);
          setIsFollowing({});
          setError("Your Twitch session has expired. Please log in again.");
          return false;
        }
      } else {
        // No auth data
        return false;
      }
    } catch (err) {
      console.error("Error checking auth status:", err);
      setError("Failed to validate your Twitch session.");
      return false;
    }
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
        
        if (auth && auth.token && auth.userData) {
          fetchEvents(auth.token, auth.userData.id);
          trackClick('twitch', 'login');
        } else {
          throw new Error('Authentication failed');
        }
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
      if (typeof window !== 'undefined' && window.logoutFromTwitch) {
        await window.logoutFromTwitch();
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
  const fetchEvents = useCallback(async (token: string, userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch followed channels
      const followsResponse = await fetch(`https://api.twitch.tv/helix/channels/followed?user_id=${userId}&first=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Client-ID': window.TWITCH_CLIENT_ID || ''
        }
      });
      
      if (!followsResponse.ok) {
        throw new Error(`Failed to fetch followed channels: ${followsResponse.status}`);
      }
      
      const followsData = await followsResponse.json();
      
      if (!followsData.data || !followsData.data.length) {
        setEvents([]);
        return;
      }
      
      // Extract broadcaster IDs
      const broadcasterIds = followsData.data.map((item: any) => item.broadcaster_id);
      
      // Fetch streams for followed channels
      const streamsResponse = await fetch(
        `https://api.twitch.tv/helix/streams?${broadcasterIds.map(id => `user_id=${id}`).join('&')}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Client-ID': window.TWITCH_CLIENT_ID || ''
          }
        }
      );
      
      if (!streamsResponse.ok) {
        throw new Error(`Failed to fetch streams: ${streamsResponse.status}`);
      }
      
      const streamsData = await streamsResponse.json();
      
      // Transform stream data to common event format
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
      
      // Set live events immediately
      setEvents(liveEvents);
      
      // Set following status for all broadcasters
      const followStatus: Record<string, boolean> = {};
      liveEvents.forEach(event => {
        followStatus[event.broadcaster_id] = true; // We know we're following since these came from followed channels
      });
      setIsFollowing(followStatus);
      
      // Try to fetch scheduled events
      try {
        // For each broadcaster, get their schedule
        const scheduledEvents: TwitchEvent[] = [];
        
        for (const broadcasterId of broadcasterIds.slice(0, 5)) { // Limit to 5 to prevent rate limiting
          try {
            const scheduleResponse = await fetch(`https://api.twitch.tv/helix/schedule?broadcaster_id=${broadcasterId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Client-ID': window.TWITCH_CLIENT_ID || ''
              }
            });
            
            if (scheduleResponse.ok) {
              const scheduleData = await scheduleResponse.json();
              
              if (scheduleData.data && scheduleData.data.segments) {
                // Add each scheduled segment
                scheduleData.data.segments.forEach((segment: TwitchScheduleSegment) => {
                  // Only include future events (in the next week)
                  const eventDate = new Date(segment.start_time);
                  const now = new Date();
                  const oneWeekFromNow = new Date();
                  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
                  
                  if (eventDate > now && eventDate < oneWeekFromNow) {
                    scheduledEvents.push({
                      type: 'scheduled',
                      id: segment.id,
                      broadcaster_id: segment.broadcaster_id,
                      broadcaster_name: segment.broadcaster_name,
                      title: segment.title,
                      category: segment.category?.name,
                      start_time: segment.start_time,
                      end_time: segment.end_time
                    });
                    
                    // Update following status
                    followStatus[segment.broadcaster_id] = true;
                  }
                });
              }
            }
          } catch (scheduleErr) {
            console.error(`Error fetching schedule for ${broadcasterId}:`, scheduleErr);
            // Continue with other broadcasters
          }
        }
        
        // Combine live and scheduled events
        const allEvents = [...liveEvents, ...scheduledEvents];
        setEvents(allEvents);
        setIsFollowing(followStatus);
      } catch (scheduleErr) {
        console.error('Error fetching scheduled events:', scheduleErr);
        // We still have live events, so don't set an error
      }
    } catch (err) {
      console.error('Error fetching Twitch events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Twitch events');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to toggle follow status for a channel
  const toggleFollow = async (broadcasterId: string, broadcasterName: string, currentlyFollowing: boolean) => {
    // Get current auth data
    if (typeof window === 'undefined' || !window.getTwitchAuth) return;
    
    const authData = window.getTwitchAuth();
    if (!authData) {
      handleLogin();
      return;
    }
    
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
        
        // Refresh events list if unfollowed a channel
        if (currentlyFollowing) {
          setTimeout(() => {
            // Small delay to allow Twitch API to update
            fetchEvents(token, userId);
          }, 1000);
        }
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
  const refreshEvents = async () => {
    const authenticated = await checkAuthStatus();
    if (!authenticated) {
      setError("Please log in to view your Twitch feed");
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

  // Get current auth status
  const authData = typeof window !== 'undefined' && window.getTwitchAuth ? window.getTwitchAuth() : null;

  return (
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

                {authData && (
                <div className="mt-8">
                    <div className="neo-card neo-card-purple p-6">
                    <h4 className="text-lg font-cyber flex items-center mb-4">
                        <FaCrown className="text-neon-pink mr-2" /> Channel VIPs
                    </h4>
                    
                    <div className="mb-4">
                        <p className="text-sm text-gray-400 mb-2">
                        VIPs are special members recognized by the broadcaster for their contributions to the channel.
                        </p>
                        
                        {/* Default to AkaneDoThis channel */}
                        <TwitchVIPsList 
                        broadcasterId="258e0f7f-cdd0-4ab8-89f2-82d97993f474" 
                        broadcasterName="AkaneDoThis" 
                        />
                    </div>
                    
                    {/* Optional: Allow switching to view VIPs of currently live followed channels */}
                    {events.filter(e => e.type === 'live').length > 0 && (
                        <div className="mt-6 pt-4 border-t border-white/10">
                        <h5 className="text-md font-cyber mb-2">
                            Live Channel VIPs
                        </h5>
                        
                        <div className="space-y-4">
                            {events
                            .filter(event => event.type === 'live')
                            .slice(0, 1) // Just show the first one to keep it simple
                            .map(event => (
                                <div key={`vips-${event.id}`}>
                                <TwitchVIPsList 
                                    broadcasterId={event.broadcaster_id} 
                                    broadcasterName={event.broadcaster_name} 
                                />
                                </div>
                            ))}
                        </div>
                        </div>
                    )}
                    </div>
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
  );
};

export default TwitchIntegration;
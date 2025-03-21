import React, { useState, useEffect } from 'react';
import { FaTwitch, FaExternalLinkAlt } from 'react-icons/fa';

// Types for Twitch data
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

interface TwitchStream {
  id: string;
  user_id: string;
  user_name: string;
  game_name: string;
  title: string;
  viewer_count: number;
  started_at: string;
  thumbnail_url: string;
  is_mature: boolean;
}

interface TwitchScheduleSegment {
  id: string;
  start_time: string;
  end_time: string;
  title: string;
  category?: {
    id: string;
    name: string;
  };
  broadcaster_id: string;
  broadcaster_name: string;
}

interface TwitchEvent {
  type: 'live' | 'scheduled';
  id: string;
  broadcaster_id: string;
  broadcaster_name: string;
  title: string;
  // Fields for live streams
  game_name?: string;
  thumbnail_url?: string;
  viewer_count?: number;
  started_at?: string;
  // Fields for scheduled streams
  category?: string;
  start_time?: string;
  end_time?: string;
  profile_image_url?: string;
}

const TwitchIntegration: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authData, setAuthData] = useState<TwitchAuthData | null>(null);
  const [events, setEvents] = useState<TwitchEvent[]>([]);

  // Check for existing authentication on component mount
  useEffect(() => {
    // Check if the window object and Twitch auth functions are available
    if (typeof window !== 'undefined' && window.getTwitchAuth) {
      const storedAuth = window.getTwitchAuth();
      if (storedAuth) {
        setAuthData(storedAuth);
        fetchEvents(storedAuth.token, storedAuth.userData.id);
      }
    }
  }, []);

  // Function to handle login
  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (typeof window !== 'undefined' && window.loginWithTwitch) {
        const auth = await window.loginWithTwitch(['user:read:follows', 'user:read:subscriptions']);
        setAuthData(auth);
        fetchEvents(auth.token, auth.userData.id);
      } else {
        throw new Error('Twitch authentication function not available');
      }
    } catch (err) {
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
          setEvents([...liveEvents, ...scheduledEvents]);
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

  // Format thumbnail URL to get a reasonable size
  const formatThumbnailUrl = (url: string) => {
    return url.replace('{width}', '320').replace('{height}', '180');
  };

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
      
      {authData && (
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
              {events.map(event => (
                <div key={event.id} className={`neo-card ${event.type === 'live' ? 'neo-card-pink' : 'neo-card-blue'} p-4`}>
                  <div className="flex items-start">
                    {event.type === 'live' && event.thumbnail_url && (
                      <div className="w-32 h-18 mr-4 overflow-hidden">
                        <img 
                          src={formatThumbnailUrl(event.thumbnail_url)} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold">{event.title}</h5>
                        {event.type === 'live' && (
                          <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">LIVE</span>
                        )}
                      </div>
                      <p className="text-sm">
                        <span className="text-gray-400">Streamer:</span> {event.broadcaster_name}
                      </p>
                      
                      {event.type === 'live' && event.game_name && (
                        <p className="text-sm">
                          <span className="text-gray-400">Playing:</span> {event.game_name}
                        </p>
                      )}
                      
                      {event.type === 'live' && event.viewer_count !== undefined && (
                        <p className="text-sm">
                          <span className="text-gray-400">Viewers:</span> {event.viewer_count.toLocaleString()}
                        </p>
                      )}
                      
                      {event.type === 'scheduled' && event.start_time && (
                        <p className="text-sm">
                          <span className="text-gray-400">Scheduled for:</span> {formatDate(event.start_time)}
                        </p>
                      )}
                      
                      <div className="mt-2">
                        <a 
                          href={`https://twitch.tv/${event.broadcaster_name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-sm px-3 py-1 inline-flex items-center ${
                            event.type === 'live' 
                              ? 'border border-neon-pink text-white hover:bg-neon-pink/20' 
                              : 'border border-electric-blue text-white hover:bg-electric-blue/20'
                          } transition rounded`}
                        >
                          {event.type === 'live' ? 'Watch Now' : 'View Channel'}
                          <FaExternalLinkAlt className="ml-1" size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              {isLoading ? (
                <p>Loading your Twitch feed...</p>
              ) : (
                <p>No live or upcoming streams found from channels you follow.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Add required global typings
declare global {
  interface Window {
    loginWithTwitch: (scopes: string[]) => Promise<any>;
    validateTwitchToken: (token: string) => Promise<boolean>;
    logoutFromTwitch: (token?: string) => Promise<boolean>;
    getTwitchAuth: () => any | null;
    TWITCH_CLIENT_ID?: string;
  }
}

export default TwitchIntegration;
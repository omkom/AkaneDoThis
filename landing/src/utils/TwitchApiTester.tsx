import React, { useState, useEffect } from 'react';
import { FaTwitch, FaCopy, FaCheck, FaInfoCircle, FaUsers, FaTrophy } from 'react-icons/fa';

// Define TypeScript interfaces for better type safety
interface TwitchUserData {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  view_count: number;
  created_at: string;
  description?: string;
  broadcaster_type: string;
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
  tags: string[];
  is_mature: boolean;
}

interface TwitchFollow {
  from_id: string;
  from_login: string;
  from_name: string;
  to_id: string;
  to_login: string;
  to_name: string;
  followed_at: string;
}

interface TwitchFollowsResponse {
  total: number;
  data: TwitchFollow[];
  pagination: {
    cursor?: string;
  };
}

interface TwitchChannelInfo {
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
  broadcaster_language: string;
  game_id: string;
  game_name: string;
  title: string;
  delay: number;
  tags: string[];
}

interface ResponseData {
  endpoint: string;
  data: any;
  status: 'success' | 'error';
  message?: string;
}

// Augment the Window interface for TypeScript
declare global {
  interface Window {
    loginWithTwitch?: (scopes: string[]) => Promise<TwitchAuthData>;
    validateTwitchToken?: (token: string) => Promise<boolean>;
    logoutFromTwitch?: (token?: string) => Promise<boolean>;
    getTwitchAuth?: () => TwitchAuthData | null;
    TWITCH_CLIENT_ID?: string;
  }
}

const TwitchApiTester: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authData, setAuthData] = useState<TwitchAuthData | null>(null);
  const [targetChannel, setTargetChannel] = useState<string>('akanedothis');
  const [channelData, setChannelData] = useState<TwitchUserData | null>(null);
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedScope, setSelectedScope] = useState<string>('user:read:follows');

  // Available scopes for testing
  const availableScopes = [
    'user:read:follows',
    'user:read:subscriptions',
    'user:read:email',
    'channel:read:subscriptions',
    'analytics:read:games',
    'bits:read',
    'channel:read:hype_train',
    'chat:read',
    'whispers:read'
  ];

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== 'undefined' && window.getTwitchAuth) {
        const storedAuth = window.getTwitchAuth();
        if (storedAuth) {
          setAuthData(storedAuth);
          try {
            const isValid = await window.validateTwitchToken?.(storedAuth.token);
            if (!isValid) {
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
        const auth = await window.loginWithTwitch([selectedScope]);
        setAuthData(auth);
        
        // Add successful login to responses
        addResponse('auth:login', auth.userData, 'success');
      } else {
        throw new Error('Twitch authentication function not available');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : 'An error occurred during authentication');
      
      // Add error to responses
      addResponse('auth:login', null, 'error', err instanceof Error ? err.message : 'Authentication error');
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
        
        // Add successful logout to responses
        addResponse('auth:logout', null, 'success', 'Successfully logged out');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during logout');
      
      // Add error to responses
      addResponse('auth:logout', null, 'error', err instanceof Error ? err.message : 'Logout error');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to search for a channel
  const searchChannel = async () => {
    if (!authData || !targetChannel) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://api.twitch.tv/helix/users?login=${targetChannel}`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`,
          'Client-ID': window.TWITCH_CLIENT_ID || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error searching channel: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        setChannelData(data.data[0]);
        addResponse('users', data.data[0], 'success');
      } else {
        setChannelData(null);
        addResponse('users', null, 'error', 'Channel not found');
      }
    } catch (err) {
      console.error("Error searching channel:", err);
      setError(err instanceof Error ? err.message : 'Error searching channel');
      addResponse('users', null, 'error', err instanceof Error ? err.message : 'Channel search error');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get channel followers
  const getChannelFollowers = async () => {
    if (!authData || !channelData) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${channelData.id}`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`,
          'Client-ID': window.TWITCH_CLIENT_ID || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching followers: ${response.status}`);
      }
      
      const data: TwitchFollowsResponse = await response.json();
      addResponse('channels/followers', data, 'success');
    } catch (err) {
      console.error("Error fetching followers:", err);
      setError(err instanceof Error ? err.message : 'Error fetching followers');
      addResponse('channels/followers', null, 'error', err instanceof Error ? err.message : 'Followers fetch error');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get channel information
  const getChannelInfo = async () => {
    if (!authData || !channelData) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${channelData.id}`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`,
          'Client-ID': window.TWITCH_CLIENT_ID || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching channel info: ${response.status}`);
      }
      
      const data = await response.json();
      addResponse('channels', data.data[0], 'success');
    } catch (err) {
      console.error("Error fetching channel info:", err);
      setError(err instanceof Error ? err.message : 'Error fetching channel info');
      addResponse('channels', null, 'error', err instanceof Error ? err.message : 'Channel info fetch error');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get stream information
  const getStreamInfo = async () => {
    if (!authData || !channelData) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://api.twitch.tv/helix/streams?user_id=${channelData.id}`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`,
          'Client-ID': window.TWITCH_CLIENT_ID || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching stream info: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        addResponse('streams', data.data[0], 'success');
      } else {
        addResponse('streams', null, 'success', 'Stream is offline');
      }
    } catch (err) {
      console.error("Error fetching stream info:", err);
      setError(err instanceof Error ? err.message : 'Error fetching stream info');
      addResponse('streams', null, 'error', err instanceof Error ? err.message : 'Stream info fetch error');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get all channel data in a single batch
  const getAllChannelData = async () => {
    if (!authData || !channelData) return;
    
    setIsLoading(true);
    setError(null);
    
    // Create a batch of promises to execute in parallel
    const promises = [
      getChannelFollowers(),
      getChannelInfo(),
      getStreamInfo()
    ];
    
    try {
      await Promise.all(promises);
      // Success already recorded in individual function calls
    } catch (err) {
      console.error("Error fetching all channel data:", err);
      setError(err instanceof Error ? err.message : 'Error fetching channel data');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add a response to the responses array
  const addResponse = (endpoint: string, data: any, status: 'success' | 'error', message?: string) => {
    setResponses(prev => [
      {
        endpoint,
        data,
        status,
        message
      },
      ...prev
    ]);
  };

  // Function to copy responses to clipboard
  const copyResponses = () => {
    const text = JSON.stringify(responses, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="twitch-api-tester">
      <div className="neo-card neo-card-purple p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-cyber neon-text purple flex items-center">
            <FaTwitch className="mr-2" /> Twitch API Tester
          </h2>
          
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
            <div className="flex items-center">
              <select
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value)}
                className="mr-2 bg-black border border-electric-blue rounded px-2 py-1 text-sm"
              >
                {availableScopes.map(scope => (
                  <option key={scope} value={scope}>{scope}</option>
                ))}
              </select>
              <button 
                onClick={handleLogin}
                disabled={isLoading}
                className="px-4 py-2 bg-bright-purple text-white hover:bg-neon-pink transition font-cyber"
              >
                {isLoading ? 'Connecting...' : 'Connect with Twitch'}
              </button>
            </div>
          )}
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 text-red-200 rounded">
            {error}
          </div>
        )}
        
        {/* Channel search */}
        <div className="mb-6">
          <div className="flex items-center">
            <input
              type="text"
              value={targetChannel}
              onChange={(e) => setTargetChannel(e.target.value)}
              placeholder="Enter channel name"
              className="flex-1 bg-black/50 border border-electric-blue rounded px-3 py-2 mr-2"
              disabled={!authData || isLoading}
            />
            <button
              onClick={searchChannel}
              disabled={!authData || isLoading || !targetChannel}
              className="px-4 py-2 bg-electric-blue/30 border border-electric-blue text-white hover:bg-electric-blue/50 transition"
            >
              Search Channel
            </button>
          </div>
        </div>
        
        {/* Channel info */}
        {channelData && (
          <div className="mb-6 p-4 border border-electric-blue rounded">
            <div className="flex items-start">
              <img 
                src={channelData.profile_image_url} 
                alt={channelData.display_name} 
                className="w-16 h-16 rounded-full mr-4"
              />
              <div>
                <h3 className="text-lg font-bold">{channelData.display_name}</h3>
                <p className="text-sm text-gray-400">@{channelData.login}</p>
                <p className="text-sm mt-1">{channelData.description || 'No description available'}</p>
                <div className="flex mt-2">
                  <span className="text-sm mr-4">
                    <FaUsers className="inline mr-1" /> {channelData.view_count.toLocaleString()} views
                  </span>
                  <span className="text-sm">
                    <FaTrophy className="inline mr-1" /> {channelData.broadcaster_type || 'regular'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={getChannelFollowers}
                disabled={isLoading}
                className="px-3 py-1 bg-neon-pink/20 border border-neon-pink text-white text-sm hover:bg-neon-pink/30 transition"
              >
                Get Followers
              </button>
              <button
                onClick={getChannelInfo}
                disabled={isLoading}
                className="px-3 py-1 bg-vivid-lime/20 border border-vivid-lime text-white text-sm hover:bg-vivid-lime/30 transition"
              >
                Get Channel Info
              </button>
              <button
                onClick={getStreamInfo}
                disabled={isLoading}
                className="px-3 py-1 bg-electric-blue/20 border border-electric-blue text-white text-sm hover:bg-electric-blue/30 transition"
              >
                Get Stream Info
              </button>
              <button
                onClick={getAllChannelData}
                disabled={isLoading}
                className="px-3 py-1 bg-bright-purple/20 border border-bright-purple text-white text-sm hover:bg-bright-purple/30 transition"
              >
                Get All Data
              </button>
            </div>
          </div>
        )}
        
        {/* Responses */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-cyber">API Responses</h3>
            <button
              onClick={copyResponses}
              disabled={responses.length === 0}
              className="px-3 py-1 bg-black/50 border border-gray-500 text-white text-sm hover:bg-gray-800 transition flex items-center"
            >
              {copied ? (
                <>
                  <FaCheck className="mr-1" /> Copied
                </>
              ) : (
                <>
                  <FaCopy className="mr-1" /> Copy All
                </>
              )}
            </button>
          </div>
          
          {responses.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-700 rounded">
              <FaInfoCircle className="mx-auto text-2xl text-gray-500 mb-2" />
              <p className="text-gray-500">No API requests made yet</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-auto">
              {responses.map((response, index) => (
                <div key={index} className={`mb-3 p-3 rounded-md border ${response.status === 'success' ? 'border-vivid-lime bg-vivid-lime/10' : 'border-red-500 bg-red-500/10'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-mono text-sm bg-black/30 px-2 py-1 rounded">
                        {response.endpoint}
                      </span>
                      <span className={`ml-2 text-xs px-2 py-1 rounded ${
                        response.status === 'success' ? 'bg-vivid-lime/30 text-vivid-lime' : 'bg-red-500/30 text-red-300'
                      }`}>
                        {response.status.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {response.message && (
                    <p className="text-sm mb-2">{response.message}</p>
                  )}
                  
                  {response.status === 'success' && response.data && (
                    <div className="mt-2">
                      {response.endpoint === 'channels/followers' && (
                        <div>
                          <p className="text-sm font-semibold">
                            Total Followers: {response.data.total}
                          </p>
                          {response.data.data && response.data.data.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-semibold mb-1">Recent Followers:</p>
                              <div className="max-h-32 overflow-y-auto">
                                {response.data.data.map((follow: TwitchFollow, idx: number) => (
                                  <div 
                                    key={idx} 
                                    className="text-xs flex justify-between items-center border-b border-gray-700 py-1"
                                  >
                                    <span>{follow.from_name}</span>
                                    <span className="text-gray-500">
                                      {formatDate(follow.followed_at)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {response.endpoint === 'channels' && (
                        <div className="text-sm">
                          <p>
                            <span className="text-gray-400">Title:</span> {response.data.title}
                          </p>
                          <p>
                            <span className="text-gray-400">Game:</span> {response.data.game_name}
                          </p>
                          <p>
                            <span className="text-gray-400">Language:</span> {response.data.broadcaster_language}
                          </p>
                          {response.data.tags && response.data.tags.length > 0 && (
                            <div className="mt-1">
                              <span className="text-gray-400">Tags:</span> 
                              <div className="flex flex-wrap gap-1 mt-1">
                                {response.data.tags.map((tag: string, idx: number) => (
                                  <span 
                                    key={idx}
                                    className="bg-electric-blue/20 px-2 py-0.5 rounded-full text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {response.endpoint === 'streams' && (
                        <div className="text-sm">
                          {response.data ? (
                            <>
                              <p>
                                <span className="text-gray-400">Status:</span> 
                                <span className="text-vivid-lime font-semibold ml-1">LIVE</span>
                              </p>
                              <p>
                                <span className="text-gray-400">Title:</span> {response.data.title}
                              </p>
                              <p>
                                <span className="text-gray-400">Game:</span> {response.data.game_name}
                              </p>
                              <p>
                                <span className="text-gray-400">Viewers:</span> {response.data.viewer_count}
                              </p>
                              <p>
                                <span className="text-gray-400">Started:</span> {formatDate(response.data.started_at)}
                              </p>
                            </>
                          ) : (
                            <p className="text-gray-400">Channel is currently offline</p>
                          )}
                        </div>
                      )}
                      
                      {response.endpoint === 'auth:login' && (
                        <div className="text-sm">
                          <p>
                            <span className="text-gray-400">Username:</span> {response.data.display_name}
                          </p>
                          <p>
                            <span className="text-gray-400">ID:</span> {response.data.id}
                          </p>
                        </div>
                      )}
                      
                      {!['channels/followers', 'channels', 'streams', 'auth:login', 'auth:logout'].includes(response.endpoint) && (
                        <pre className="text-xs bg-black/50 p-2 rounded max-h-40 overflow-auto">
                          {JSON.stringify(response.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-black/80 p-8 rounded-lg border border-electric-blue">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-electric-blue mx-auto mb-4"></div>
              <p className="text-center">Loading data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwitchApiTester;

// services/twitch/twitch-api.ts
// Core Twitch API service with consistent error handling and retry logic

import { TWITCH_CONFIG } from './twitch-client';
import { getBestAvailableToken } from './twitch-auth';
import {
  TwitchRequestOptions,
  TwitchUserData,
  TwitchStream,
  TwitchChannel,
  TwitchFollowers,
  TwitchChannelData,
  TwitchResponse
} from './twitch-types';

/**
 * Base request function for Twitch API with retry logic and consistent error handling
 * @param {string} endpoint - API endpoint (without /helix prefix)
 * @param {TwitchRequestOptions} options - Request options
 * @param {number} retryCount - Current retry attempt (internal use)
 * @returns {Promise<T>} API response data
 */
export async function twitchRequest<T>(
  endpoint: string,
  options: TwitchRequestOptions = {},
  retryCount = 0
): Promise<T> {
  const {
    method = 'GET',
    params = {},
    data = null,
    token = null,
    userToken = null
  } = options;
  
  // Get token if not provided
  const accessToken = userToken || token || await getBestAvailableToken();
  
  if (!accessToken) {
    throw new Error('No authentication token available');
  }
  
  try {
    const url = new URL(`${TWITCH_CONFIG.API_BASE_URL}/${endpoint}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Client-ID': TWITCH_CONFIG.CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(data);
    }
    
    const response = await fetch(url.toString(), requestOptions);
    
    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Ratelimit-Reset') || '5';
      const retryMs = parseInt(retryAfter, 10) * 1000;
      
      console.warn(`Twitch API rate limited. Retrying after ${retryMs}ms`);
      
      // Wait for the specified time before retrying
      await new Promise(resolve => setTimeout(resolve, retryMs));
      
      // Retry the request if we haven't exceeded max retries
      if (retryCount < TWITCH_CONFIG.MAX_RETRY_ATTEMPTS) {
        return twitchRequest(endpoint, options, retryCount + 1);
      }
    }
    
    // Handle authentication errors
    if (response.status === 401) {
      console.warn('Twitch API authentication error. Refreshing token and retrying...');
      
      // Don't use the same token for retry
      const newOptions = {
        ...options,
        token: null,
        userToken: null
      };
      
      // Retry with a new token if we haven't exceeded max retries
      if (retryCount < TWITCH_CONFIG.MAX_RETRY_ATTEMPTS) {
        return twitchRequest(endpoint, newOptions, retryCount + 1);
      }
    }
    
    if (!response.ok) {
      let errorData = {};
      
      try {
        errorData = await response.json();
      } catch (e) {
        // Ignore parsing errors
      }
      
      throw new Error(`Twitch API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error(`Error calling Twitch API (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Get broadcaster information by login name
 * @param {string} login - Broadcaster's login name
 * @returns {Promise<TwitchUserData|null>} Broadcaster data or null if not found
 */
export async function getBroadcasterByLogin(login: string): Promise<TwitchUserData | null> {
  try {
    const response = await twitchRequest<TwitchResponse<TwitchUserData>>('users', {
      params: { login }
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error getting broadcaster by login:', error);
    return null;
  }
}

/**
 * Get broadcaster information by ID
 * @param {string} id - Broadcaster's ID
 * @returns {Promise<TwitchUserData|null>} Broadcaster data or null if not found
 */
export async function getBroadcasterById(id: string): Promise<TwitchUserData | null> {
  try {
    const response = await twitchRequest<TwitchResponse<TwitchUserData>>('users', {
      params: { id }
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error getting broadcaster by ID:', error);
    return null;
  }
}

/**
 * Get stream information for a channel
 * @param {string} channelName - Channel login name
 * @returns {Promise<TwitchStream|null>} Stream data or null if offline
 */
export async function getStreamInfo(channelName: string): Promise<TwitchStream | null> {
  try {
    const response = await twitchRequest<TwitchResponse<TwitchStream>>('streams', {
      params: { user_login: channelName }
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error getting stream info:', error);
    return null;
  }
}

/**
 * Get channel information
 * @param {string} broadcasterId - Broadcaster's ID
 * @returns {Promise<TwitchChannel|null>} Channel data or null if error
 */
export async function getChannelInfo(broadcasterId: string): Promise<TwitchChannel | null> {
  try {
    if (!broadcasterId) return null;
    
    const response = await twitchRequest<TwitchResponse<TwitchChannel>>('channels', {
      params: { broadcaster_id: broadcasterId }
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error getting channel info:', error);
    return null;
  }
}

/**
 * Get followers information
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {Object} options - Optional parameters (first, after)
 * @returns {Promise<TwitchFollowers>} Followers data
 */
export async function getFollowers(
  broadcasterId: string,
  options: { first?: number; after?: string } = {}
): Promise<TwitchFollowers> {
  try {
    if (!broadcasterId) return { total: 0, data: [] };
    
    const response = await twitchRequest<TwitchFollowers>('channels/followers', {
      params: { 
        broadcaster_id: broadcasterId,
        ...options
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error getting followers info:', error);
    return { total: 0, data: [] };
  }
}

/**
 * Check if a user follows a channel
 * @param {string} userId - User ID
 * @param {string} broadcasterId - Broadcaster ID
 * @returns {Promise<boolean>} True if following, false otherwise
 */
export async function checkFollowing(userId: string, broadcasterId: string): Promise<boolean> {
  try {
    const response = await twitchRequest<TwitchFollowers>('users/follows', {
      params: {
        from_id: userId,
        to_id: broadcasterId
      }
    });
    
    return response.data && response.data.length > 0;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}

/**
 * Follow a channel
 * @param {string} userId - User ID
 * @param {string} broadcasterId - Broadcaster ID
 * @param {boolean} notifications - Enable notifications
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<boolean>} True if successful
 */
export async function followChannel(
  userId: string,
  broadcasterId: string,
  notifications = false,
  userToken: string
): Promise<boolean> {
  try {
    if (!userToken) {
      throw new Error('User token required to follow a channel');
    }
    
    await twitchRequest('users/follows', {
      method: 'POST',
      userToken,
      data: {
        from_id: userId,
        to_id: broadcasterId,
        notifications
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error following channel:', error);
    return false;
  }
}

/**
 * Unfollow a channel
 * @param {string} userId - User ID
 * @param {string} broadcasterId - Broadcaster ID
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<boolean>} True if successful
 */
export async function unfollowChannel(
  userId: string,
  broadcasterId: string,
  userToken: string
): Promise<boolean> {
  try {
    if (!userToken) {
      throw new Error('User token required to unfollow a channel');
    }
    
    await twitchRequest('users/follows', {
      method: 'DELETE',
      userToken,
      params: {
        from_id: userId,
        to_id: broadcasterId
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error unfollowing channel:', error);
    return false;
  }
}

/**
 * Get channel schedule
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {Object} options - Optional parameters
 * @returns {Promise<any>} Schedule data
 */
export async function getChannelSchedule(
  broadcasterId: string,
  options: Record<string, any> = {}
): Promise<any> {
  try {
    if (!broadcasterId) return { data: { segments: [] } };
    
    const response = await twitchRequest<any>('schedule', {
      params: { broadcaster_id: broadcasterId, ...options }
    });
    
    return response;
  } catch (error) {
    console.error('Error getting channel schedule:', error);
    return { data: { segments: [] } };
  }
}

/**
 * Get combined channel data (stream, channel info, followers)
 * @param {string} channelName - Channel login name
 * @returns {Promise<TwitchChannelData>} Combined channel data
 */
export async function getChannelData(channelName: string): Promise<TwitchChannelData> {
  try {
    // First get broadcaster info
    const broadcaster = await getBroadcasterByLogin(channelName);
    
    if (!broadcaster) {
      throw new Error(`Broadcaster not found: ${channelName}`);
    }
    
    const broadcasterId = broadcaster.id;
    
    // Fetch all data in parallel
    const [streamInfo, channelInfo, followersInfo] = await Promise.all([
      getStreamInfo(channelName),
      getChannelInfo(broadcasterId),
      getFollowers(broadcasterId)
    ]);
    
    // Determine if the channel is live
    const isLive = !!streamInfo;
    
    // Build the combined data object
    return {
      broadcaster,
      stream: streamInfo,
      channel: channelInfo,
      followers: followersInfo,
      isLive,
      stats: {
        followerCount: followersInfo.total || 0,
        viewerCount: isLive ? streamInfo?.viewer_count || 0 : 0,
        streamTitle: isLive ? streamInfo?.title || '' : (channelInfo ? channelInfo.title : ''),
        game: isLive ? streamInfo?.game_name || '' : (channelInfo ? channelInfo.game_name : ''),
        startedAt: isLive ? streamInfo?.started_at || null : null,
        thumbnailUrl: isLive ? streamInfo?.thumbnail_url.replace('{width}x{height}', '300x300') || null : null,
        tags: isLive ? streamInfo?.tags || [] : []
      }
    };
  } catch (error) {
    console.error('Error getting combined channel data:', error);
    throw error;
  }
}
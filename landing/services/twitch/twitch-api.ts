// landing/services/twitch/twitch-api.ts
import { TWITCH_CONFIG } from './twitch-client';
import { getBestAvailableToken } from './twitch-auth';
import {
  TwitchRequestOptions,
  TwitchUserData,
  TwitchStream,
  TwitchChannel,
  TwitchFollowers,
  TwitchChannelData,
  TwitchResponse,
  TwitchSubscription,
  TwitchVIPData
} from './twitch-types';

/**
 * Enhanced request function for Twitch API with optimized caching and retry logic
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
    userToken = null,
    requiresUserToken = false,
    cacheKey = null
  } = options;
  
  // Use token with appropriate authorization
  let accessToken = userToken || token;
  if (!accessToken) {
    accessToken = await getBestAvailableToken();
  }
  
  // Verify we have user token if endpoint requires it
  if (requiresUserToken && !userToken) {
    throw new Error('This endpoint requires user authentication');
  }
  
  // Check for valid token
  if (!accessToken) {
    throw new Error('No authentication token available');
  }
  
  // Cache support - check if we have a cache key and should try to get cached data
  if (cacheKey && method === 'GET' && window._twitchApiCache) {
    const cachedData = window._twitchApiCache.get(cacheKey);
    if (cachedData) {
      const { data: cacheData, expiry } = cachedData;
      if (expiry > Date.now()) {
        return cacheData as T;
      }
      // Expired, remove from cache
      window._twitchApiCache.delete(cacheKey);
    }
  }
  
  try {
    const url = new URL(`${TWITCH_CONFIG.API_BASE_URL}/${endpoint}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Handle array parameters
        if (Array.isArray(value)) {
          value.forEach(item => url.searchParams.append(key, String(item)));
        } else {
          url.searchParams.append(key, String(value));
        }
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
    
    // No content responses for successful DELETE/PUT operations
    if (response.status === 204) {
      return {} as T;
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
    
    const responseData = await response.json() as T;
    
    // Store in cache if we have a cache key
    if (cacheKey && method === 'GET') {
      if (!window._twitchApiCache) {
        window._twitchApiCache = new Map();
      }
      
      // Cache for 1 minute (60000ms) for regular data, adjust as needed
      const cacheDuration = 60000;
      window._twitchApiCache.set(cacheKey, {
        data: responseData,
        expiry: Date.now() + cacheDuration
      });
    }
    
    return responseData;
  } catch (error) {
    console.error(`Error calling Twitch API (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Get broadcaster information by login name
 */
export async function getBroadcasterByLogin(login: string): Promise<TwitchUserData | null> {
  try {
    const cacheKey = `broadcaster:${login}`;
    
    const response = await twitchRequest<TwitchResponse<TwitchUserData>>('users', {
      params: { login },
      cacheKey
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
 * Get stream information for a channel
 */
export async function getStreamInfo(channelName: string): Promise<TwitchStream | null> {
  try {
    // No caching for live stream data - need fresh data
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
 */
export async function getChannelInfo(broadcasterId: string): Promise<TwitchChannel | null> {
  try {
    if (!broadcasterId) return null;
    
    const cacheKey = `channel:${broadcasterId}`;
    
    const response = await twitchRequest<TwitchResponse<TwitchChannel>>('channels', {
      params: { broadcaster_id: broadcasterId },
      cacheKey
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
 */
export async function getFollowers(
  broadcasterId: string,
  options: { first?: number; after?: string } = {}
): Promise<TwitchFollowers> {
  try {
    if (!broadcasterId) return { total: 0, data: [] };
    
    const cacheKey = `followers:${broadcasterId}`;
    
    const response = await twitchRequest<TwitchFollowers>('channels/followers', {
      params: { 
        broadcaster_id: broadcasterId,
        ...options
      },
      cacheKey
    });
    
    return response;
  } catch (error) {
    console.error('Error getting followers info:', error);
    return { total: 0, data: [] };
  }
}

/**
 * Check if a user follows a channel
 */
export async function checkFollowing(
  userId: string, 
  broadcasterId: string,
  token?: string
): Promise<boolean> {
  try {
    if (!userId || !broadcasterId) return false;
    
    const cacheKey = `follows:${userId}:${broadcasterId}`;
    
    const response = await twitchRequest<TwitchFollowers>('channels/followers', {
      params: {
        user_id: userId,
        broadcaster_id: broadcasterId
      },
      token,
      cacheKey
    });
    
    return response.data && response.data.length > 0;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}

/**
 * Follow a channel
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
    
    await twitchRequest('channels/follow', {
      method: 'POST',
      userToken,
      requiresUserToken: true,
      data: {
        broadcaster_id: broadcasterId,
        user_id: userId,
        allow_notifications: notifications
      }
    });
    
    // Clear any follow cache for this relationship
    if (window._twitchApiCache) {
      window._twitchApiCache.delete(`follows:${userId}:${broadcasterId}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error following channel:', error);
    return false;
  }
}

/**
 * Unfollow a channel
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
    
    await twitchRequest('channels/follow', {
      method: 'DELETE',
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        user_id: userId
      }
    });
    
    // Clear any follow cache for this relationship
    if (window._twitchApiCache) {
      window._twitchApiCache.delete(`follows:${userId}:${broadcasterId}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error unfollowing channel:', error);
    return false;
  }
}

/**
 * Get channel subscription count
 */
export async function getSubscriptionCount(
  broadcasterId: string,
  userToken: string
): Promise<number | null> {
  try {
    if (!broadcasterId || !userToken) return null;
    
    const response = await twitchRequest<any>('subscriptions', {
      params: { broadcaster_id: broadcasterId },
      userToken,
      requiresUserToken: true
    });
    
    // Return total from response
    return response.total || 0;
  } catch (error) {
    // If error is due to permissions, don't log it as an error
    if (error instanceof Error && error.message.includes("401")) {
      console.info('No subscription read permission for this channel');
      return null;
    }
    
    console.error('Error getting subscription count:', error);
    return null;
  }
}

/**
 * Check if the user is subscribed to a channel
 */
export async function checkSubscription(
  broadcasterId: string,
  userId: string,
  userToken: string
): Promise<TwitchSubscription | null> {
  try {
    if (!broadcasterId || !userId || !userToken) return null;
    
    const response = await twitchRequest<TwitchResponse<TwitchSubscription>>('subscriptions/user', {
      params: {
        broadcaster_id: broadcasterId,
        user_id: userId
      },
      userToken,
      requiresUserToken: true
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  } catch (error) {
    // If error is due to not being subscribed, don't log it as an error
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    
    console.error('Error checking subscription status:', error);
    return null;
  }
}

/**
 * Get VIPs for a channel
 */
export async function getChannelVIPs(
  broadcasterId: string,
  options: { user_id?: string[]; first?: number; after?: string } = {},
  userToken: string
): Promise<TwitchResponse<TwitchVIPData>> {
  try {
    if (!broadcasterId || !userToken) {
      return { data: [] };
    }
    
    return await twitchRequest<TwitchResponse<TwitchVIPData>>('channels/vips', {
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        ...options
      }
    });
  } catch (error) {
    console.error('Error getting channel VIPs:', error);
    return { data: [] };
  }
}

/**
 * Get combined channel data (stream, channel info, followers, subscription count)
 */
export async function getChannelData(
  channelName: string,
  userToken?: string
): Promise<TwitchChannelData> {
  try {
    // First get broadcaster info
    const broadcaster = await getBroadcasterByLogin(channelName);
    
    if (!broadcaster) {
      throw new Error(`Broadcaster not found: ${channelName}`);
    }
    
    const broadcasterId = broadcaster.id;
    
    // Fetch basic data in parallel
    const [streamInfo, channelInfo, followersInfo] = await Promise.all([
      getStreamInfo(channelName),
      getChannelInfo(broadcasterId),
      getFollowers(broadcasterId)
    ]);
    
    // Determine if the channel is live
    const isLive = !!streamInfo;
    
    // Initialize channel data
    let channelData: TwitchChannelData = {
      broadcaster,
      stream: streamInfo,
      channel: channelInfo,
      followers: followersInfo,
      isLive,
      subscriberCount: null,
      stats: {
        followerCount: followersInfo.total || 0,
        viewerCount: isLive ? streamInfo?.viewer_count || 0 : 0,
        streamTitle: isLive ? streamInfo?.title || '' : (channelInfo ? channelInfo.title : ''),
        game: isLive ? streamInfo?.game_name || '' : (channelInfo ? channelInfo.game_name : ''),
        startedAt: isLive ? streamInfo?.started_at || null : null,
        thumbnailUrl: isLive ? streamInfo?.thumbnail_url || null : null,
        tags: isLive ? streamInfo?.tags || [] : []
      }
    };
    
    // If user token provided, try to fetch subscription count
    if (userToken) {
      try {
        // Try to get subscription count
        const subCount = await getSubscriptionCount(broadcasterId, userToken);
        if (subCount !== null) {
          channelData.subscriberCount = subCount;
        }
        
        // Try to fetch VIPs data
        const vipsData = await getChannelVIPs(broadcasterId, {}, userToken);
        if (vipsData && vipsData.data) {
          channelData.vips = vipsData.data;
          channelData.stats.vipCount = vipsData.data.length;
        }
      } catch (subError) {
        console.warn('Error fetching subscription data:', subError);
        // Continue without subscription data
      }
    }
    
    return channelData;
  } catch (error) {
    console.error('Error getting combined channel data:', error);
    throw error;
  }
}

// Add a global declaration for the cache
declare global {
  interface Window {
    _twitchApiCache?: Map<string, { data: any; expiry: number }>;
  }
}
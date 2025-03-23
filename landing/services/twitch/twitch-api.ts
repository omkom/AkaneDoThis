/**
 * Twitch API service
 */
import { TWITCH_CONFIG } from './twitch-client';
import { getBestAvailableToken } from './twitch-auth';

interface RequestOptions {
  method?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  data?: any;
  token?: string | null;
  userToken?: string | null;
}

export interface TwitchChannel {
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

export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  tags: string[];
  is_mature: boolean;
}

export interface TwitchBroadcaster {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  created_at: string;
}

export interface TwitchFollowers {
  total: number;
  data: any[];
}

export interface TwitchChannelData {
  broadcaster: TwitchBroadcaster;
  stream: TwitchStream | null;
  channel: TwitchChannel | null;
  followers: TwitchFollowers;
  isLive: boolean;
  stats: {
    followerCount: number;
    viewerCount: number;
    streamTitle: string;
    game: string;
    startedAt: string | null;
    thumbnailUrl: string | null;
    tags: string[];
  };
}

/**
 * Base request function for Twitch API
 */
async function twitchRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
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
    const url = new URL(`https://api.twitch.tv/helix/${endpoint}`);
    
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
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
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
 */
export async function getBroadcasterByLogin(login: string): Promise<TwitchBroadcaster | null> {
  try {
    interface UsersResponse {
      data: TwitchBroadcaster[];
    }
    
    const response = await twitchRequest<UsersResponse>('users', {
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
 * Get stream information for a channel
 */
export async function getStreamInfo(channelName: string): Promise<TwitchStream | null> {
  try {
    interface StreamsResponse {
      data: TwitchStream[];
    }
    
    const response = await twitchRequest<StreamsResponse>('streams', {
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
    
    interface ChannelsResponse {
      data: TwitchChannel[];
    }
    
    const response = await twitchRequest<ChannelsResponse>('channels', {
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
 */
export async function getFollowers(broadcasterId: string): Promise<TwitchFollowers> {
  try {
    if (!broadcasterId) return { total: 0, data: [] };
    
    interface FollowersResponse {
      total: number;
      data: any[];
    }
    
    const response = await twitchRequest<FollowersResponse>('channels/followers', {
      params: { broadcaster_id: broadcasterId }
    });
    
    return response;
  } catch (error) {
    console.error('Error getting followers info:', error);
    return { total: 0, data: [] };
  }
}

/**
 * Get channel schedule
 */
export async function getChannelSchedule(broadcasterId: string, options: Record<string, any> = {}): Promise<any> {
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
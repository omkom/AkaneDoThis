// services/twitch/twitch-api.ts
// Core Twitch API service with enhanced functionality and error handling

import { TWITCH_CONFIG } from './twitch-client';
import { getTwitchAuth, getBestAvailableToken } from './twitch-auth';
import {
  TwitchRequestOptions,
  TwitchUserData,
  TwitchStream,
  TwitchChannel,
  TwitchFollowers,
  TwitchChannelData,
  TwitchResponse,
  TwitchSchedule,
  TwitchVideo,
  TwitchClip,
  TwitchChatSettings,
  TwitchEmote,
  TwitchSubscription,
  TwitchPoll
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
    userToken = null,
    requiresUserToken = false
  } = options;
  
  // Get token if not provided
  let accessToken = userToken || token;
  if (!accessToken) {
    accessToken = await getTwitchAuth();
  }
  
  if (!accessToken) {
    throw new Error('No authentication token available');
  }
  
  // Verify we have user token if endpoint requires it
  if (requiresUserToken && !userToken) {
    throw new Error('This endpoint requires a user authentication token');
  }
  
  try {
    const url = new URL(`${TWITCH_CONFIG.API_BASE_URL}/${endpoint}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Handle array parameters (used in several Twitch endpoints)
        if (Array.isArray(value)) {
          value.forEach(item => {
            url.searchParams.append(key, String(item));
          });
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
    
    return await response.json() as T;
  } catch (error) {
    console.error(`Error calling Twitch API (${endpoint}):`, error);
    throw error;
  }
}

// ============================================================
// USER RELATED ENDPOINTS
// ============================================================

/**
 * Get user information by ID or login
 * @param {Object} params - Request parameters
 * @returns {Promise<TwitchResponse<TwitchUserData>>} User data
 */
export async function getUsers(params: { 
  id?: string[] | string, 
  login?: string[] | string 
}): Promise<TwitchResponse<TwitchUserData>> {
  // Convert single values to arrays for consistent handling
  const processedParams: Record<string, string[] | undefined> = {};
  
  if (params.id) {
    processedParams.id = Array.isArray(params.id) ? params.id : [params.id];
  }
  
  if (params.login) {
    processedParams.login = Array.isArray(params.login) ? params.login : [params.login];
  }
  
  return twitchRequest<TwitchResponse<TwitchUserData>>('users', {
    params: processedParams
  });
}

/**
 * Get broadcaster information by login name
 * @param {string} login - Broadcaster's login name
 * @returns {Promise<TwitchUserData|null>} Broadcaster data or null if not found
 */
export async function getBroadcasterByLogin(login: string): Promise<TwitchUserData | null> {
  try {
    const response = await getUsers({ login });
    
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
    const response = await getUsers({ id });
    
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
 * Update user information
 * @param {string} description - New channel description
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<TwitchUserData|null>} Updated user data or null if error
 */
export async function updateUser(
  description: string,
  userToken: string
): Promise<TwitchUserData | null> {
  try {
    const response = await twitchRequest<TwitchResponse<TwitchUserData>>('users', {
      method: 'PUT',
      userToken,
      requiresUserToken: true,
      params: { description }
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

/**
 * Get user's block list
 * @param {string} broadcasterId - Broadcaster ID
 * @param {string} userToken - User's OAuth token
 * @param {Object} options - Optional parameters
 * @returns {Promise<TwitchResponse<any>>} Block list data
 */
export async function getUserBlockList(
  broadcasterId: string,
  userToken: string,
  options: { first?: number, after?: string } = {}
): Promise<TwitchResponse<any>> {
  return twitchRequest<TwitchResponse<any>>('users/blocks', {
    userToken,
    requiresUserToken: true,
    params: {
      broadcaster_id: broadcasterId,
      ...options
    }
  });
}

/**
 * Block a user
 * @param {string} targetUserId - ID of user to block
 * @param {string} userToken - User's OAuth token
 * @param {Object} options - Optional parameters
 * @returns {Promise<boolean>} Success status
 */
export async function blockUser(
  targetUserId: string,
  userToken: string,
  options: { source_context?: string, reason?: string } = {}
): Promise<boolean> {
  try {
    await twitchRequest('users/blocks', {
      method: 'PUT',
      userToken,
      requiresUserToken: true,
      params: {
        target_user_id: targetUserId,
        ...options
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error blocking user:', error);
    return false;
  }
}

/**
 * Unblock a user
 * @param {string} targetUserId - ID of user to unblock
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<boolean>} Success status
 */
export async function unblockUser(
  targetUserId: string,
  userToken: string
): Promise<boolean> {
  try {
    await twitchRequest('users/blocks', {
      method: 'DELETE',
      userToken,
      requiresUserToken: true,
      params: {
        target_user_id: targetUserId
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error unblocking user:', error);
    return false;
  }
}

// ============================================================
// CHANNEL RELATED ENDPOINTS
// ============================================================

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
 * Get chat settings for a channel
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} moderatorId - Moderator's ID
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<TwitchChatSettings|null>} Chat settings or null if error
 */
export async function getChatSettings(
  broadcasterId: string,
  moderatorId: string,
  userToken: string
): Promise<TwitchChatSettings | null> {
  try {
    const response = await twitchRequest<TwitchResponse<TwitchChatSettings>>('chat/settings', {
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        moderator_id: moderatorId
      }
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error getting chat settings:', error);
    return null;
  }
}

/**
 * Update chat settings for a channel
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} moderatorId - Moderator's ID
 * @param {Object} settings - Settings to update
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<TwitchChatSettings|null>} Updated chat settings or null if error
 */
export async function updateChatSettings(
  broadcasterId: string,
  moderatorId: string,
  settings: Partial<TwitchChatSettings>,
  userToken: string
): Promise<TwitchChatSettings | null> {
  try {
    const response = await twitchRequest<TwitchResponse<TwitchChatSettings>>('chat/settings', {
      method: 'PATCH',
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        moderator_id: moderatorId
      },
      data: settings
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error updating chat settings:', error);
    return null;
  }
}

/**
 * Send a chat message to a channel
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} senderId - Sender's ID
 * @param {string} message - Message to send
 * @param {string} userToken - User's OAuth token
 * @param {string} replyParentMessageId - Optional parent message ID for replies
 * @returns {Promise<boolean>} Success status
 */
export async function sendChatMessage(
  broadcasterId: string,
  senderId: string,
  message: string,
  userToken: string,
  replyParentMessageId?: string
): Promise<boolean> {
  try {
    const data: Record<string, any> = {
      broadcaster_id: broadcasterId,
      sender_id: senderId,
      message
    };
    
    if (replyParentMessageId) {
      data.reply_parent_message_id = replyParentMessageId;
    }
    
    await twitchRequest('chat/messages', {
      method: 'POST',
      userToken,
      requiresUserToken: true,
      data
    });
    
    return true;
  } catch (error) {
    console.error('Error sending chat message:', error);
    return false;
  }
}

/**
 * Get channel emotes
 * @param {string} broadcasterId - Broadcaster's ID
 * @returns {Promise<TwitchResponse<TwitchEmote>>} Emotes response
 */
export async function getChannelEmotes(broadcasterId: string): Promise<TwitchResponse<TwitchEmote>> {
  return twitchRequest<TwitchResponse<TwitchEmote>>('chat/emotes', {
    params: { broadcaster_id: broadcasterId }
  });
}

/**
 * Get global emotes
 * @returns {Promise<TwitchResponse<TwitchEmote>>} Global emotes response
 */
export async function getGlobalEmotes(): Promise<TwitchResponse<TwitchEmote>> {
  return twitchRequest<TwitchResponse<TwitchEmote>>('chat/emotes/global');
}

// ============================================================
// STREAM RELATED ENDPOINTS
// ============================================================

/**
 * Get stream information for one or more channels
 * @param {Object} params - Query parameters (user_id, user_login, game_id, etc.)
 * @returns {Promise<TwitchResponse<TwitchStream>>} Stream data
 */
export async function getStreams(params: Record<string, any> = {}): Promise<TwitchResponse<TwitchStream>> {
  return twitchRequest<TwitchResponse<TwitchStream>>('streams', {
    params
  });
}

/**
 * Get stream information for a single channel
 * @param {string} channelName - Channel login name
 * @returns {Promise<TwitchStream|null>} Stream data or null if offline
 */
export async function getStreamInfo(channelName: string): Promise<TwitchStream | null> {
  try {
    const response = await getStreams({ user_login: channelName });
    
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
 * Get streams followed by user
 * @param {string} userId - User ID
 * @param {Object} options - Optional parameters
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<TwitchResponse<TwitchStream>>} Followed streams data
 */
export async function getFollowedStreams(
  userId: string,
  options: { first?: number, after?: string } = {},
  userToken: string
): Promise<TwitchResponse<TwitchStream>> {
  return twitchRequest<TwitchResponse<TwitchStream>>('streams/followed', {
    userToken,
    requiresUserToken: true,
    params: {
      user_id: userId,
      ...options
    }
  });
}

/**
 * Get channel's stream key
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<string|null>} Stream key or null if error
 */
export async function getStreamKey(
  broadcasterId: string,
  userToken: string
): Promise<string | null> {
  try {
    const response = await twitchRequest<any>('streams/key', {
      userToken,
      requiresUserToken: true,
      params: { broadcaster_id: broadcasterId }
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0].stream_key;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting stream key:', error);
    return null;
  }
}

/**
 * Create a stream marker
 * @param {string} userId - User ID
 * @param {string} description - Optional marker description
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<any>} Marker data or null if error
 */
export async function createStreamMarker(
  userId: string,
  description: string,
  userToken: string
): Promise<any> {
  try {
    const response = await twitchRequest('streams/markers', {
      method: 'POST',
      userToken,
      requiresUserToken: true,
      data: {
        user_id: userId,
        description
      }
    });
    
    return response.data && response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Error creating stream marker:', error);
    return null;
  }
}

/**
 * Get stream markers for a user or video
 * @param {Object} params - Parameters (user_id or video_id)
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<any>} Markers data
 */
export async function getStreamMarkers(
  params: { user_id?: string, video_id?: string },
  userToken: string
): Promise<any> {
  return twitchRequest('streams/markers', {
    userToken,
    requiresUserToken: true,
    params
  });
}

// ============================================================
// VIDEOS, CLIPS AND SCHEDULE ENDPOINTS
// ============================================================

/**
 * Get videos for a user, game, or by ID
 * @param {Object} params - Query parameters
 * @returns {Promise<TwitchResponse<TwitchVideo>>} Videos data
 */
export async function getVideos(params: Record<string, any>): Promise<TwitchResponse<TwitchVideo>> {
  return twitchRequest<TwitchResponse<TwitchVideo>>('videos', {
    params
  });
}

/**
 * Delete videos
 * @param {string[]} ids - Video IDs to delete
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<string[]>} Deleted video IDs
 */
export async function deleteVideos(
  ids: string[],
  userToken: string
): Promise<string[]> {
  try {
    const response = await twitchRequest<{ data: string[] }>('videos', {
      method: 'DELETE',
      userToken,
      requiresUserToken: true,
      params: { id: ids }
    });
    
    return response.data || [];
  } catch (error) {
    console.error('Error deleting videos:', error);
    return [];
  }
}

/**
 * Create a clip
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {boolean} hasDelay - Whether to add a delay before capture
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<any>} Clip data or null
 */
export async function createClip(
  broadcasterId: string,
  hasDelay = false,
  userToken: string
): Promise<any> {
  try {
    const response = await twitchRequest<any>('clips', {
      method: 'POST',
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        has_delay: hasDelay
      }
    });
    
    return response.data && response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Error creating clip:', error);
    return null;
  }
}

/**
 * Get clips for a broadcaster or game
 * @param {Object} params - Query parameters
 * @returns {Promise<TwitchResponse<TwitchClip>>} Clips data
 */
export async function getClips(params: Record<string, any>): Promise<TwitchResponse<TwitchClip>> {
  return twitchRequest<TwitchResponse<TwitchClip>>('clips', {
    params
  });
}

/**
 * Get channel schedule
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {Object} options - Optional parameters
 * @returns {Promise<TwitchSchedule>} Schedule data
 */
export async function getChannelSchedule(
  broadcasterId: string,
  options: Record<string, any> = {}
): Promise<TwitchSchedule> {
  try {
    if (!broadcasterId) return { data: { segments: [] } };
    
    return twitchRequest<TwitchSchedule>('schedule', {
      params: { broadcaster_id: broadcasterId, ...options }
    });
  } catch (error) {
    console.error('Error getting channel schedule:', error);
    return { data: { segments: [] } };
  }
}

/**
 * Update channel schedule settings
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {Object} settings - Schedule settings to update
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<boolean>} Success status
 */
export async function updateScheduleSettings(
  broadcasterId: string,
  settings: Record<string, any>,
  userToken: string
): Promise<boolean> {
  try {
    await twitchRequest('schedule/settings', {
      method: 'PATCH',
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        ...settings
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error updating schedule settings:', error);
    return false;
  }
}

/**
 * Create a schedule segment
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {Object} segmentData - Schedule segment data
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<TwitchSchedule|null>} Updated schedule or null if error
 */
export async function createScheduleSegment(
  broadcasterId: string,
  segmentData: Record<string, any>,
  userToken: string
): Promise<TwitchSchedule | null> {
  try {
    return twitchRequest<TwitchSchedule>('schedule/segment', {
      method: 'POST',
      userToken,
      requiresUserToken: true,
      params: { broadcaster_id: broadcasterId },
      data: segmentData
    });
  } catch (error) {
    console.error('Error creating schedule segment:', error);
    return null;
  }
}

/**
 * Update a schedule segment
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} segmentId - Segment ID
 * @param {Object} segmentData - Updated segment data
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<TwitchSchedule|null>} Updated schedule or null if error
 */
export async function updateScheduleSegment(
  broadcasterId: string,
  segmentId: string,
  segmentData: Record<string, any>,
  userToken: string
): Promise<TwitchSchedule | null> {
  try {
    return twitchRequest<TwitchSchedule>('schedule/segment', {
      method: 'PATCH',
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        id: segmentId
      },
      data: segmentData
    });
  } catch (error) {
    console.error('Error updating schedule segment:', error);
    return null;
  }
}

/**
 * Delete a schedule segment
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} segmentId - Segment ID
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<boolean>} Success status
 */
export async function deleteScheduleSegment(
  broadcasterId: string,
  segmentId: string,
  userToken: string
): Promise<boolean> {
  try {
    await twitchRequest('schedule/segment', {
      method: 'DELETE',
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        id: segmentId
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting schedule segment:', error);
    return false;
  }
}

// ============================================================
// SEARCH ENDPOINTS
// ============================================================

/**
 * Search categories
 * @param {string} query - Search query
 * @param {Object} options - Optional parameters
 * @returns {Promise<TwitchResponse<any>>} Search results
 */
export async function searchCategories(
  query: string,
  options: { first?: number; after?: string } = {}
): Promise<TwitchResponse<any>> {
  return twitchRequest<TwitchResponse<any>>('search/categories', {
    params: {
      query,
      ...options
    }
  });
}

/**
 * Search channels
 * @param {string} query - Search query
 * @param {Object} options - Optional parameters
 * @returns {Promise<TwitchResponse<any>>} Search results
 */
export async function searchChannels(
  query: string,
  options: { live_only?: boolean; first?: number; after?: string } = {}
): Promise<TwitchResponse<any>> {
  return twitchRequest<TwitchResponse<any>>('search/channels', {
    params: {
      query,
      ...options
    }
  });
}

// ============================================================
// SUBSCRIPTIONS AND FOLLOWS ENDPOINTS
// ============================================================

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
    
    return twitchRequest<TwitchFollowers>('channels/followers', {
      params: { 
        broadcaster_id: broadcasterId,
        ...options
      }
    });
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
 * Get broadcaster subscriptions
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {Object} options - Optional parameters
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<TwitchResponse<TwitchSubscription>>} Subscriptions data
 */
export async function getBroadcasterSubscriptions(
  broadcasterId: string,
  options: { user_id?: string[]; first?: number; after?: string } = {},
  userToken: string
): Promise<TwitchResponse<TwitchSubscription>> {
  return twitchRequest<TwitchResponse<TwitchSubscription>>('subscriptions', {
    userToken,
    requiresUserToken: true,
    params: {
      broadcaster_id: broadcasterId,
      ...options
    }
  });
}

/**
 * Check user subscription status
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} userId - User's ID
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<TwitchSubscription|null>} Subscription data or null
 */
export async function checkUserSubscription(
  broadcasterId: string,
  userId: string,
  userToken: string
): Promise<TwitchSubscription | null> {
  try {
    const response = await twitchRequest<TwitchResponse<TwitchSubscription>>('subscriptions/user', {
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        user_id: userId
      }
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error checking user subscription:', error);
    return null;
  }
}

// ============================================================
// MODERATION ENDPOINTS
// ============================================================

/**
 * Get moderators for a channel
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {Object} options - Optional parameters
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<TwitchResponse<any>>} Moderators data
 */
export async function getModerators(
  broadcasterId: string,
  options: { user_id?: string[]; first?: number; after?: string } = {},
  userToken: string
): Promise<TwitchResponse<any>> {
  return twitchRequest<TwitchResponse<any>>('moderation/moderators', {
    userToken,
    requiresUserToken: true,
    params: {
      broadcaster_id: broadcasterId,
      ...options
    }
  });
}

/**
 * Add a channel moderator
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} userId - User ID to make moderator
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<boolean>} Success status
 */
export async function addModerator(
  broadcasterId: string,
  userId: string,
  userToken: string
): Promise<boolean> {
  try {
    await twitchRequest('moderation/moderators', {
      method: 'POST',
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        user_id: userId
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error adding moderator:', error);
    return false;
  }
}

/**
 * Remove a channel moderator
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} userId - User ID to remove as moderator
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<boolean>} Success status
 */
export async function removeModerator(
  broadcasterId: string,
  userId: string,
  userToken: string
): Promise<boolean> {
  try {
    await twitchRequest('moderation/moderators', {
      method: 'DELETE',
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        user_id: userId
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error removing moderator:', error);
    return false;
  }
}

/**
 * Get VIPs for a channel
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {Object} options - Optional parameters
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<TwitchResponse<any>>} VIPs data
 */
export async function getVIPs(
  broadcasterId: string,
  options: { user_id?: string[]; first?: number; after?: string } = {},
  userToken: string
): Promise<TwitchResponse<any>> {
  return twitchRequest<TwitchResponse<any>>('channels/vips', {
    userToken,
    requiresUserToken: true,
    params: {
      broadcaster_id: broadcasterId,
      ...options
    }
  });
}

/**
 * Add a channel VIP
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} userId - User ID to make VIP
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<boolean>} Success status
 */
export async function addVIP(
  broadcasterId: string,
  userId: string,
  userToken: string
): Promise<boolean> {
  try {
    await twitchRequest('channels/vips', {
      method: 'POST',
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        user_id: userId
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error adding VIP:', error);
    return false;
  }
}

/**
 * Remove a channel VIP
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} userId - User ID to remove as VIP
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<boolean>} Success status
 */
export async function removeVIP(
  broadcasterId: string,
  userId: string,
  userToken: string
): Promise<boolean> {
  try {
    await twitchRequest('channels/vips', {
      method: 'DELETE',
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        user_id: userId
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error removing VIP:', error);
    return false;
  }
}

/**
 * Ban a user from a channel
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} moderatorId - Moderator's ID
 * @param {string} userId - User ID to ban
 * @param {Object} options - Ban options
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<any>} Ban data or null
 */
export async function banUser(
  broadcasterId: string,
  moderatorId: string,
  userId: string,
  options: { duration?: number; reason?: string } = {},
  userToken: string
): Promise<any> {
  try {
    const data = {
      data: {
        user_id: userId,
        ...options
      }
    };
    
    const response = await twitchRequest<any>('moderation/bans', {
      method: 'POST',
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        moderator_id: moderatorId
      },
      data
    });
    
    return response.data && response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Error banning user:', error);
    return null;
  }
}

/**
 * Unban a user from a channel
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} moderatorId - Moderator's ID
 * @param {string} userId - User ID to unban
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<boolean>} Success status
 */
export async function unbanUser(
  broadcasterId: string,
  moderatorId: string,
  userId: string,
  userToken: string
): Promise<boolean> {
  try {
    await twitchRequest('moderation/bans', {
      method: 'DELETE',
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        moderator_id: moderatorId,
        user_id: userId
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error unbanning user:', error);
    return false;
  }
}

/**
 * Get banned users for a channel
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {Object} options - Optional parameters
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<TwitchResponse<any>>} Banned users data
 */
export async function getBannedUsers(
  broadcasterId: string,
  options: { user_id?: string[]; first?: number; after?: string; before?: string } = {},
  userToken: string
): Promise<TwitchResponse<any>> {
  return twitchRequest<TwitchResponse<any>>('moderation/banned', {
    userToken,
    requiresUserToken: true,
    params: {
      broadcaster_id: broadcasterId,
      ...options
    }
  });
}

/**
 * Send a chat announcement
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} moderatorId - Moderator's ID
 * @param {string} message - Announcement message
 * @param {string} color - Optional color (blue, green, orange, purple)
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<boolean>} Success status
 */
export async function sendAnnouncement(
  broadcasterId: string,
  moderatorId: string,
  message: string,
  color?: string,
  userToken?: string
): Promise<boolean> {
  try {
    const data: Record<string, any> = { message };
    if (color) {
      data.color = color;
    }
    
    await twitchRequest('chat/announcements', {
      method: 'POST',
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        moderator_id: moderatorId
      },
      data
    });
    
    return true;
  } catch (error) {
    console.error('Error sending announcement:', error);
    return false;
  }
}

/**
 * Send a shoutout to another channel
 * @param {string} fromBroadcasterId - Broadcaster's ID sending the shoutout
 * @param {string} toBroadcasterId - Broadcaster's ID receiving the shoutout
 * @param {string} moderatorId - Moderator's ID
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<boolean>} Success status
 */
export async function sendShoutout(
  fromBroadcasterId: string,
  toBroadcasterId: string,
  moderatorId: string,
  userToken: string
): Promise<boolean> {
  try {
    await twitchRequest('chat/shoutouts', {
      method: 'POST',
      userToken,
      requiresUserToken: true,
      params: {
        from_broadcaster_id: fromBroadcasterId,
        to_broadcaster_id: toBroadcasterId,
        moderator_id: moderatorId
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error sending shoutout:', error);
    return false;
  }
}

// ============================================================
// POLLS AND PREDICTIONS ENDPOINTS
// ============================================================

/**
 * Get channel polls
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {Object} options - Optional parameters
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<TwitchResponse<TwitchPoll>>} Polls data
 */
export async function getPolls(
  broadcasterId: string,
  options: { id?: string[]; first?: number; after?: string } = {},
  userToken: string
): Promise<TwitchResponse<TwitchPoll>> {
  return twitchRequest<TwitchResponse<TwitchPoll>>('polls', {
    userToken,
    requiresUserToken: true,
    params: {
      broadcaster_id: broadcasterId,
      ...options
    }
  });
}

/**
 * Create a poll
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} title - Poll title
 * @param {Array} choices - Poll choices
 * @param {number} duration - Poll duration in seconds
 * @param {Object} options - Optional parameters
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<TwitchPoll|null>} New poll data or null
 */
export async function createPoll(
  broadcasterId: string,
  title: string,
  choices: Array<{ title: string }>,
  duration: number,
  options: { channel_points_voting_enabled?: boolean; channel_points_per_vote?: number } = {},
  userToken: string
): Promise<TwitchPoll | null> {
  try {
    const data = {
      broadcaster_id: broadcasterId,
      title,
      choices,
      duration,
      ...options
    };
    
    const response = await twitchRequest<TwitchResponse<TwitchPoll>>('polls', {
      method: 'POST',
      userToken,
      requiresUserToken: true,
      data
    });
    
    return response.data && response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Error creating poll:', error);
    return null;
  }
}

/**
 * End a poll
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} pollId - Poll ID
 * @param {string} status - New status (TERMINATED or ARCHIVED)
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<TwitchPoll|null>} Updated poll data or null
 */
export async function endPoll(
  broadcasterId: string,
  pollId: string,
  status: string,
  userToken: string
): Promise<TwitchPoll | null> {
  try {
    const data = {
      broadcaster_id: broadcasterId,
      id: pollId,
      status
    };
    
    const response = await twitchRequest<TwitchResponse<TwitchPoll>>('polls', {
      method: 'PATCH',
      userToken,
      requiresUserToken: true,
      data
    });
    
    return response.data && response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Error ending poll:', error);
    return null;
  }
}

/**
 * Get predictions for a channel
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {Object} options - Optional parameters
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<TwitchResponse<any>>} Predictions data
 */
export async function getPredictions(
  broadcasterId: string,
  options: { id?: string[]; first?: number; after?: string } = {},
  userToken: string
): Promise<TwitchResponse<any>> {
  return twitchRequest<TwitchResponse<any>>('predictions', {
    userToken,
    requiresUserToken: true,
    params: {
      broadcaster_id: broadcasterId,
      ...options
    }
  });
}

/**
 * Create a prediction
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} title - Prediction title
 * @param {Array} outcomes - Prediction outcomes
 * @param {number} predictionWindow - Prediction window in seconds
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<any>} New prediction data or null
 */
export async function createPrediction(
  broadcasterId: string,
  title: string,
  outcomes: Array<{ title: string }>,
  predictionWindow: number,
  userToken: string
): Promise<any> {
  try {
    const data = {
      broadcaster_id: broadcasterId,
      title,
      outcomes,
      prediction_window: predictionWindow
    };
    
    const response = await twitchRequest<any>('predictions', {
      method: 'POST',
      userToken,
      requiresUserToken: true,
      data
    });
    
    return response.data && response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Error creating prediction:', error);
    return null;
  }
}

/**
 * End a prediction
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} predictionId - Prediction ID
 * @param {string} status - New status (RESOLVED, CANCELED, LOCKED)
 * @param {string} winningOutcomeId - Required if status is RESOLVED
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<any>} Updated prediction data or null
 */
export async function endPrediction(
  broadcasterId: string,
  predictionId: string,
  status: string,
  winningOutcomeId: string | null,
  userToken: string
): Promise<any> {
  try {
    const data: Record<string, any> = {
      broadcaster_id: broadcasterId,
      id: predictionId,
      status
    };
    
    if (status === 'RESOLVED' && winningOutcomeId) {
      data.winning_outcome_id = winningOutcomeId;
    }
    
    const response = await twitchRequest<any>('predictions', {
      method: 'PATCH',
      userToken,
      requiresUserToken: true,
      data
    });
    
    return response.data && response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Error ending prediction:', error);
    return null;
  }
}

// ============================================================
// CHANNEL POINTS ENDPOINTS
// ============================================================

/**
 * Get custom rewards for a channel
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {Object} options - Optional parameters
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<TwitchResponse<any>>} Custom rewards data
 */
export async function getCustomRewards(
  broadcasterId: string,
  options: { id?: string[]; only_manageable_rewards?: boolean } = {},
  userToken: string
): Promise<TwitchResponse<any>> {
  return twitchRequest<TwitchResponse<any>>('channel_points/custom_rewards', {
    userToken,
    requiresUserToken: true,
    params: {
      broadcaster_id: broadcasterId,
      ...options
    }
  });
}

/**
 * Create a custom reward
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {Object} rewardData - Reward configuration
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<any>} New reward data or null
 */
export async function createCustomReward(
  broadcasterId: string,
  rewardData: Record<string, any>,
  userToken: string
): Promise<any> {
  try {
    const data = {
      broadcaster_id: broadcasterId,
      ...rewardData
    };
    
    const response = await twitchRequest<any>('channel_points/custom_rewards', {
      method: 'POST',
      userToken,
      requiresUserToken: true,
      params: { broadcaster_id: broadcasterId },
      data
    });
    
    return response.data && response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Error creating custom reward:', error);
    return null;
  }
}

/**
 * Update a custom reward
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} rewardId - Reward ID
 * @param {Object} rewardData - Updated reward configuration
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<any>} Updated reward data or null
 */
export async function updateCustomReward(
  broadcasterId: string,
  rewardId: string,
  rewardData: Record<string, any>,
  userToken: string
): Promise<any> {
  try {
    const response = await twitchRequest<any>('channel_points/custom_rewards', {
      method: 'PATCH',
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        id: rewardId
      },
      data: rewardData
    });
    
    return response.data && response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Error updating custom reward:', error);
    return null;
  }
}

/**
 * Delete a custom reward
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} rewardId - Reward ID
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<boolean>} Success status
 */
export async function deleteCustomReward(
  broadcasterId: string,
  rewardId: string,
  userToken: string
): Promise<boolean> {
  try {
    await twitchRequest('channel_points/custom_rewards', {
      method: 'DELETE',
      userToken,
      requiresUserToken: true,
      params: {
        broadcaster_id: broadcasterId,
        id: rewardId
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting custom reward:', error);
    return false;
  }
}

// ============================================================
// WHISPERS ENDPOINTS
// ============================================================

/**
 * Send a whisper to a user
 * @param {string} fromUserId - Sender's ID
 * @param {string} toUserId - Recipient's ID
 * @param {string} message - Whisper message
 * @param {string} userToken - User's OAuth token
 * @returns {Promise<boolean>} Success status
 */
export async function sendWhisper(
  fromUserId: string,
  toUserId: string,
  message: string,
  userToken: string
): Promise<boolean> {
  try {
    await twitchRequest('whispers', {
      method: 'POST',
      userToken,
      requiresUserToken: true,
      params: {
        from_user_id: fromUserId,
        to_user_id: toUserId
      },
      data: { message }
    });
    
    return true;
  } catch (error) {
    console.error('Error sending whisper:', error);
    return false;
  }
}

// ============================================================
// COMBINED DATA ENDPOINTS
// ============================================================

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

//## OR

// services/twitch/twitch-api.ts
// Enhanced with subscription API support

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
  TwitchSubscriptions
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
        if (Array.isArray(value)) {
          // Handle array parameters (like multiple user_ids)
          value.forEach(v => url.searchParams.append(key, String(v)));
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
 * Get channel subscription information
 * @param {string} broadcasterId - Broadcaster's ID
 * @param {string} userToken - User access token with channel:read:subscriptions scope
 * @returns {Promise<TwitchSubscriptions|null>} Subscription data or null if error
 */
export async function getChannelSubscriptions(
  broadcasterId: string,
  userToken: string
): Promise<TwitchSubscriptions | null> {
  try {
    if (!broadcasterId || !userToken) return null;
    
    const response = await twitchRequest<TwitchSubscriptions>('subscriptions', {
      params: { broadcaster_id: broadcasterId },
      userToken
    });
    
    return response;
  } catch (error) {
    console.error('Error getting channel subscriptions:', error);
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
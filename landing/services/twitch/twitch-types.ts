// services/twitch/twitch-types.ts
// Enhanced type definitions with improved subscription support

/**
 * Authentication data structure
 */
export interface TwitchAuthData {
    token: string;
    userData: TwitchUserData;
  }
  
  /**
   * User data structure
   */
  export interface TwitchUserData {
    id: string;
    login: string;
    display_name: string;
    profile_image_url: string;
    view_count: number;
    created_at: string;
    email?: string;
    description?: string;
    broadcaster_type: string;
    offline_image_url?: string;
    type?: string;
  }
  
  /**
   * Stream information structure
   */
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
    tag_ids?: string[];
    tags: string[];
    is_mature: boolean;
  }
  
  /**
   * Channel information structure
   */
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
  
  /**
   * Subscription information
   */
  export interface TwitchSubscription {
    broadcaster_id: string;
    broadcaster_login: string; 
    broadcaster_name: string;
    gifter_id?: string;
    gifter_login?: string;
    gifter_name?: string;
    is_gift: boolean;
    plan_name: string;
    tier: string; // "1000", "2000", or "3000"
    user_id: string;
    user_name: string;
    user_login: string;
  }
  
  /**
   * Followers information structure
   */
  export interface TwitchFollowers {
    total: number;
    data: TwitchFollow[];
    pagination?: {
      cursor?: string;
    };
  }
  
  /**
   * Follow relationship structure
   */
  export interface TwitchFollow {
    followed_at: string;
    from_id?: string;
    from_login?: string;
    from_name?: string;
    to_id?: string;
    to_login?: string;
    to_name?: string;
    user_id?: string;     // New API format
    user_login?: string;  // New API format
    user_name?: string;   // New API format
  }
  
  /**
   * Schedule segment structure
   */
  export interface TwitchScheduleSegment {
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
    profile_image_url?: string;
  }
  
  /**
   * Combined channel data structure
   */
  export interface TwitchChannelData {
    broadcaster: TwitchUserData;
    stream: TwitchStream | null;
    channel: TwitchChannel | null;
    followers: TwitchFollowers;
    isLive: boolean;
    subscriberCount: number | null; // Added subscriber count 
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
   * API request options
   */
  export interface TwitchRequestOptions {
    method?: string;
    params?: Record<string, string | number | boolean | undefined | null | string[]>;
    data?: Record<string, unknown>;
    token?: string | null;
    userToken?: string | null;
    requiresUserToken?: boolean;
    cacheKey?: string | null; // Added cache key support
  }
  
  /**
   * Base Twitch API response structure
   */
  export interface TwitchResponse<T> {
    data: T[];
    pagination?: {
      cursor?: string;
    };
    total?: number;
    points?: number;
  }
  
  /**
   * Twitch Schedule structure
   */
  export interface TwitchSchedule {
    data: {
      segments: TwitchScheduleSegment[];
      broadcaster_id?: string;
      broadcaster_name?: string;
      broadcaster_login?: string;
    };
    pagination?: {
      cursor?: string;
    };
  }

// Add these interfaces to the existing services/twitch/twitch-types.ts file

/**
 * VIP data structure
 */
export interface TwitchVIPData {
    user_id: string;
    user_name: string;
    user_login: string;
  }
  
  // Update TwitchChannelData to include VIPs
  export interface TwitchChannelData {
    broadcaster: TwitchUserData;
    stream: TwitchStream | null;
    channel: TwitchChannel | null;
    followers: TwitchFollowers;
    vips?: TwitchVIPData[];
    isLive: boolean;
    stats: {
      followerCount: number;
      viewerCount: number;
      streamTitle: string;
      game: string;
      startedAt: string | null;
      thumbnailUrl: string | null;
      tags: string[];
      vipCount?: number;
    };
  }
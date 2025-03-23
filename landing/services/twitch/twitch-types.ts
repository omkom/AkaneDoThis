// services/twitch/twitch-types.ts
// Comprehensive TypeScript interfaces for Twitch API objects

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
    from_id: string;
    from_login: string;
    from_name: string;
    to_id: string;
    to_login: string;
    to_name: string;
    followed_at: string;
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
   * Unified event structure (for live streams or scheduled events)
   */
  export interface TwitchEvent {
    type: 'live' | 'scheduled';
    id: string;
    broadcaster_id: string;
    broadcaster_name: string;
    title: string;
    game_name?: string;
    thumbnail_url?: string;
    viewer_count?: number;
    started_at?: string;
    category?: string;
    start_time?: string;
    end_time?: string;
    profile_image_url?: string;
    is_following?: boolean;
  }
  
  /**
   * API request options
   */
  export interface TwitchRequestOptions {
    method?: string;
    params?: Record<string, string | number | boolean | undefined | null>;
    data?: any;
    token?: string | null;
    userToken?: string | null;
  }
  
  /**
   * Base Twitch API response structure
   */
  export interface TwitchResponse<T> {
    data: T[];
    pagination?: {
      cursor?: string;
    };
  }
// landing/services/twitch/getVideos.ts
import { TWITCH_CONFIG } from './twitch-client';
import { getBestAvailableToken } from './twitch-auth';
import { TwitchResponse, TwitchVideo } from './twitch-types';

/**
 * Get videos for a specific channel (past broadcasts, highlights, or uploads)
 * 
 * @param broadcasterId Twitch broadcaster ID
 * @param options Additional options for the request
 * @param userToken Optional user authentication token
 * @returns Promise resolving to videos data
 */
export async function getVideos(
  broadcasterId: string,
  options: {
    type?: 'all' | 'archive' | 'highlight' | 'upload';
    first?: number;
    after?: string;
    before?: string;
    sort?: 'time' | 'trending' | 'views';
    language?: string;
    period?: 'all' | 'day' | 'week' | 'month';
  } = {},
  userToken?: string
): Promise<TwitchResponse<TwitchVideo>> {
  try {
    if (!broadcasterId) {
      throw new Error('Broadcaster ID is required to fetch videos');
    }
    
    // Get authentication token
    let token = userToken;
    if (!token) {
      token = await getBestAvailableToken();
    }
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    // Build URL with query parameters
    const url = new URL(`${TWITCH_CONFIG.API_BASE_URL}/videos`);
    url.searchParams.append('user_id', broadcasterId);
    
    // Add optional parameters
    if (options.type) {
      url.searchParams.append('type', options.type);
    }
    
    if (options.first) {
      url.searchParams.append('first', options.first.toString());
    }
    
    if (options.after) {
      url.searchParams.append('after', options.after);
    }
    
    if (options.before) {
      url.searchParams.append('before', options.before);
    }
    
    if (options.sort) {
      url.searchParams.append('sort', options.sort);
    }
    
    if (options.language) {
      url.searchParams.append('language', options.language);
    }
    
    if (options.period) {
      url.searchParams.append('period', options.period);
    }
    
    // Make API request
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Client-ID': TWITCH_CONFIG.CLIENT_ID,
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Handle errors
    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.status} ${response.statusText}`);
    }
    
    // Parse and return data
    const data = await response.json();
    return data as TwitchResponse<TwitchVideo>;
  } catch (error) {
    console.error('Error fetching videos:', error);
    // Return empty response as fallback
    return { data: [] };
  }
}
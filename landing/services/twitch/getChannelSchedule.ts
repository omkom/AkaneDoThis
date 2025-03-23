// services/twitch/getChannelSchedule.ts
import { TWITCH_CONFIG } from './twitch-client';
import { getBestAvailableToken } from './twitch-auth';
import { TwitchSchedule } from './twitch-types';

/**
 * Get the schedule for a specific channel
 * 
 * @param broadcasterId Twitch broadcaster ID
 * @param userToken Optional user token for authenticated requests
 * @param start_time Optional ISO 8601 timestamp for schedule start time
 * @param utc_offset Optional UTC offset for the schedule in minutes
 * @param first Optional max number of items to return (default 20)
 * @returns Promise resolving to channel schedule data
 */
export async function getChannelSchedule(
  broadcasterId: string,
  userToken?: string | null,
  start_time?: string,
  utc_offset?: string,
  first?: number
): Promise<TwitchSchedule> {
  try {
    if (!broadcasterId) {
      throw new Error('Broadcaster ID is required to fetch schedule');
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
    const url = new URL(`${TWITCH_CONFIG.API_BASE_URL}/schedule`);
    url.searchParams.append('broadcaster_id', broadcasterId);
    
    if (start_time) {
      url.searchParams.append('start_time', start_time);
    }
    
    if (utc_offset) {
      url.searchParams.append('utc_offset', utc_offset);
    }
    
    if (first) {
      url.searchParams.append('first', first.toString());
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
      // Special case: 404 means no schedule set up, return empty schedule
      if (response.status === 404) {
        return {
          data: {
            segments: [],
            broadcaster_id: broadcasterId
          }
        };
      }
      
      throw new Error(`Failed to fetch channel schedule: ${response.status} ${response.statusText}`);
    }
    
    // Parse and return data
    const data = await response.json();
    return data as TwitchSchedule;
  } catch (error) {
    console.error('Error fetching channel schedule:', error);
    // Return empty schedule as fallback
    return {
      data: {
        segments: [],
        broadcaster_id: broadcasterId
      }
    };
  }
}

// Register with the main API module
// Add this function in twitch-api.ts exports
export * from './getChannelSchedule';
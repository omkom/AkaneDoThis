// src/utils/twitch-debug.ts

/**
 * Debug utilities for testing Twitch embed functionality
 * Only active in development mode
 */

let fakeLiveStatusEnabled = false;

/**
 * Force the Twitch embed to show as if the stream was live
 * Useful for testing the embed without having to wait for an actual live stream
 * 
 * @param {boolean} isLive - Whether to simulate the stream as live
 */
export function debugSimulateLiveStatus(isLive = true): void {
  if (process.env.NODE_ENV !== 'production') {
    fakeLiveStatusEnabled = isLive;
    console.log(`[Debug] Simulating stream as ${isLive ? 'LIVE' : 'OFFLINE'}`);
    
    // Store setting in localStorage to persist through refreshes
    try {
      localStorage.setItem('debug_twitch_live', isLive ? 'true' : 'false');
    } catch (err) {
      // Ignore localStorage errors
    }
    
    // Add visual indicator to show we're in debug mode
    if (isLive) {
      const debugBadge = document.createElement('div');
      debugBadge.id = 'twitch-debug-badge';
      debugBadge.style.position = 'fixed';
      debugBadge.style.bottom = '10px';
      debugBadge.style.left = '10px';
      debugBadge.style.background = 'rgba(255, 0, 0, 0.8)';
      debugBadge.style.color = 'white';
      debugBadge.style.padding = '5px 10px';
      debugBadge.style.borderRadius = '4px';
      debugBadge.style.fontSize = '12px';
      debugBadge.style.fontWeight = 'bold';
      debugBadge.style.zIndex = '9999';
      debugBadge.textContent = 'DEBUG: FAKE LIVE MODE';
      
      document.body.appendChild(debugBadge);
    } else {
      const existingBadge = document.getElementById('twitch-debug-badge');
      if (existingBadge) {
        existingBadge.remove();
      }
    }
  }
}

/**
 * Check if we should simulate the stream as live
 * @returns {boolean} Whether to simulate the stream as live
 */
export function isDebugLiveEnabled(): boolean {
  if (process.env.NODE_ENV !== 'production') {
    // Check both memory flag and localStorage
    if (fakeLiveStatusEnabled) {
      return true;
    }
    
    try {
      return localStorage.getItem('debug_twitch_live') === 'true';
    } catch (err) {
      // Ignore localStorage errors
    }
  }
  return false;
}

// Initialize from localStorage on load
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  try {
    if (localStorage.getItem('debug_twitch_live') === 'true') {
      // Delay execution to ensure DOM is ready
      setTimeout(() => {
        debugSimulateLiveStatus(true);
      }, 500);
    }
  } catch (err) {
    // Ignore localStorage errors
  }
  
  // Add to window object for console access
  if (typeof window !== 'undefined') {
    (window as any).debugTwitchLive = debugSimulateLiveStatus;
  }
}

export default {
  debugSimulateLiveStatus,
  isDebugLiveEnabled
};
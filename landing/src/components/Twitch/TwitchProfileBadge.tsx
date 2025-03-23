// landing/src/components/Twitch/TwitchProfileBadge.tsx
// Updated with proper type imports and cleaned up inline implementations

import React, { useState, useEffect, useRef } from 'react';
import { FaTwitch, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { trackClick } from '../../utils/analytics';
import { TwitchAuthData, TwitchUserData } from '../../../services/twitch/twitch-types';

/**
 * TwitchProfileBadge Component
 * Displays the user's Twitch profile and provides login/logout functionality
 */
const TwitchProfileBadge: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authData, setAuthData] = useState<TwitchAuthData | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLButtonElement>(null);

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== 'undefined' && window.getTwitchAuth) {
        const storedAuth = window.getTwitchAuth();
        if (storedAuth) {
          setAuthData(storedAuth);
          
          // Validate token before using it
          try {
            const isValid = await window.validateTwitchToken?.(storedAuth.token);
            if (!isValid) {
              // Token is invalid, log out
              await window.logoutFromTwitch?.();
              setAuthData(null);
              setError("Your Twitch session has expired");
            }
          } catch (err) {
            console.error("Error validating token:", err);
          }
        }
      }
    };
    
    checkAuth();
  }, []);

  // Add click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        profileRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to handle login
  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (typeof window !== 'undefined' && window.loginWithTwitch) {
        const auth = await window.loginWithTwitch([
          'user:read:follows',
          'user:read:subscriptions',
          'user:edit:follows'
        ]);
        
        setAuthData(auth);
        trackClick('twitch', 'login-header');
      } else {
        throw new Error('Twitch authentication function not available');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : 'Authentication error');
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
        setShowDropdown(false);
        trackClick('twitch', 'logout-header');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout error');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="twitch-profile-badge relative">
      {authData ? (
        <div className="flex items-center">
          <button 
            ref={profileRef}
            onClick={toggleDropdown}
            className="flex items-center space-x-2 p-1.5 rounded hover:bg-black/30 transition"
          >
            <img 
              src={authData.userData.profile_image_url} 
              alt={authData.userData.display_name} 
              className="w-8 h-8 rounded-full border-2 border-bright-purple"
            />
            <span className="hidden md:block text-sm font-medium mr-1">
              {authData.userData.display_name}
            </span>
            <FaTwitch className="text-bright-purple" />
          </button>
          
          {showDropdown && (
            <>
              {/* Mobile full-screen overlay */}
              <div className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-40" onClick={() => setShowDropdown(false)} />
              
              {/* Dropdown content */}
              <div 
                ref={dropdownRef}
                className={`
                  fixed md:absolute 
                  md:top-full md:right-0 md:mt-1 md:w-64
                  inset-x-0 bottom-0 md:bottom-auto 
                  max-h-[66vh] md:max-h-none 
                  neo-card neo-card-purple card-3d p-0 z-50 dropdown-menu
                  ${window.innerWidth < 768 ? 'rounded-t-xl rounded-b-none' : 'rounded-xl'}
                `}
              >
                <div className="bg-bright-purple/30 backdrop-blur-md py-3 px-4 text-center border-b border-white/10">
                  <p className="text-sm font-medium font-cyber">{authData.userData.display_name}</p>
                  <p className="text-xs text-white/70">Connected with Twitch</p>
                </div>
                
                <button 
                  onClick={() => {
                    window.location.href = `https://twitch.tv/${authData.userData.login}`;
                    trackClick('twitch', 'view-profile');
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-3 text-sm hover:bg-bright-purple/20 transition text-left"
                >
                  <FaTwitch className="text-bright-purple" />
                  <span>View Profile</span>
                </button>
                
                <button 
                  onClick={() => {
                    window.location.href = "#twitch";
                    trackClick('twitch', 'manage-follows');
                    setShowDropdown(false);
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-3 text-sm hover:bg-bright-purple/20 transition text-left"
                >
                  <FaCog className="text-gray-300" />
                  <span>Manage Follows</span>
                </button>
                
                <button 
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="flex items-center space-x-2 w-full px-3 py-3 text-sm hover:bg-bright-purple/20 transition text-left border-t border-white/10 mt-2"
                >
                  <FaSignOutAlt className="text-gray-300" />
                  <span>{isLoading ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button 
          onClick={handleLogin}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-1.5 bg-bright-purple/20 border border-bright-purple rounded text-white hover:bg-bright-purple/30 transition"
        >
          <FaTwitch className="text-bright-purple" />
          <span className="text-sm font-cyber">{isLoading ? 'Connecting...' : 'Connect'}</span>
        </button>
      )}
      
      {error && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-red-900/90 text-white text-xs p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

// Add window augmentation for TypeScript
declare global {
  interface Window {
    loginWithTwitch?: (scopes: string[]) => Promise<TwitchAuthData>;
    validateTwitchToken?: (token: string) => Promise<boolean>;
    logoutFromTwitch?: (token?: string) => Promise<boolean>;
    getTwitchAuth?: () => TwitchAuthData | null;
    TWITCH_CLIENT_ID?: string;
  }
}

export default TwitchProfileBadge;
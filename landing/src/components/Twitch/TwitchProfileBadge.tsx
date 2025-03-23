import React, { useState, useEffect, useRef } from 'react';
import { FaTwitch, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { trackClick } from '../../utils/analytics';
import { TwitchAuthData } from '../../../services/twitch/twitch-types';

/**
 * TwitchProfileBadge Component
 * Displays user's Twitch profile with simplified authentication flow
 */
const TwitchProfileBadge: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authData, setAuthData] = useState<TwitchAuthData | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLButtonElement>(null);

  // Check authentication on mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Check if user is authenticated
  const checkAuthentication = async () => {
    if (typeof window !== 'undefined' && window.getTwitchAuth) {
      try {
        const storedAuth = window.getTwitchAuth();
        if (storedAuth) {
          // Validate token before using
          const isValid = await window.validateTwitchToken?.(storedAuth.token);
          if (isValid) {
            setAuthData(storedAuth);
          } else {
            // Token invalid, clean up
            await window.logoutFromTwitch?.();
            setAuthData(null);
          }
        }
      } catch (err) {
        console.error("Error validating token:", err);
        setError("Authentication error");
      }
    }
  };

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

  // Handle Twitch login
  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (typeof window !== 'undefined' && window.loginWithTwitch) {
        // Request necessary scopes
        const auth = await window.loginWithTwitch([
          'user:read:follows',
          'user:read:subscriptions',
          'user:edit:follows'
        ]);
        
        setAuthData(auth);
        trackClick('twitch', 'login-header');
      } else {
        throw new Error('Twitch authentication not available');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
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

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Hide error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="twitch-profile-badge relative">
      {authData ? (
        <div className="flex items-center">
          <button 
            ref={profileRef}
            onClick={toggleDropdown}
            className="flex items-center space-x-2 p-1.5 rounded hover:bg-black/30 transition"
            aria-label="Twitch profile menu"
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
              {/* Mobile overlay */}
              <div 
                className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-40" 
                onClick={() => setShowDropdown(false)} 
              />
              
              {/* Dropdown content */}
              <div 
                ref={dropdownRef}
                className="fixed md:absolute md:top-full md:right-0 md:mt-1 md:w-64
                          inset-x-0 bottom-0 md:bottom-auto max-h-[66vh] md:max-h-none 
                          neo-card neo-card-purple card-3d p-0 z-50 dropdown-menu
                          rounded-xl md:rounded-lg"
                style={{
                  borderTopLeftRadius: window.innerWidth < 768 ? '0.75rem' : '0',
                  borderTopRightRadius: window.innerWidth < 768 ? '0.75rem' : '0',
                  borderBottomLeftRadius: window.innerWidth < 768 ? '0' : '0.5rem',
                  borderBottomRightRadius: window.innerWidth < 768 ? '0' : '0.5rem'
                }}
              >
                <div className="bg-bright-purple/30 backdrop-blur-md py-3 px-4 text-center border-b border-white/10">
                  <p className="text-sm font-medium font-cyber">{authData.userData.display_name}</p>
                  <p className="text-xs text-white/70">Connected with Twitch</p>
                </div>
                
                <a 
                  href={`https://twitch.tv/${authData.userData.login}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 w-full px-3 py-3 text-sm hover:bg-bright-purple/20 transition text-left"
                  onClick={() => trackClick('twitch', 'view-profile')}
                >
                  <FaTwitch className="text-bright-purple" />
                  <span>View Profile</span>
                </a>
                
                <a 
                  href="#twitch"
                  className="flex items-center space-x-2 w-full px-3 py-3 text-sm hover:bg-bright-purple/20 transition text-left"
                  onClick={() => {
                    trackClick('twitch', 'manage-follows');
                    setShowDropdown(false);
                  }}
                >
                  <FaCog className="text-gray-300" />
                  <span>Manage Follows</span>
                </a>
                
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
          aria-label="Connect to Twitch"
        >
          <FaTwitch className="text-bright-purple" />
          <span className="text-sm font-cyber">{isLoading ? 'Connecting...' : 'Connect'}</span>
        </button>
      )}
      
      {error && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-red-900/90 text-white text-xs p-2 rounded z-50">
          {error}
        </div>
      )}
    </div>
  );
};

export default TwitchProfileBadge;
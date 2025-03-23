// src/components/Twitch/TwitchVIPsList.tsx
import React, { useState, useEffect } from 'react';
import { FaCrown, FaUser, FaExternalLinkAlt } from 'react-icons/fa';
import { trackClick } from '../../utils/analytics';
import { TwitchVIPData } from '../../../services/twitch/twitch-types';
import { getChannelVIPs } from '../../../services/twitch/twitch-api';

interface TwitchVIPsListProps {
  broadcasterId: string;
  broadcasterName: string;
}

const TwitchVIPsList: React.FC<TwitchVIPsListProps> = ({ broadcasterId, broadcasterName }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [vips, setVips] = useState<TwitchVIPData[]>([]);
  
  useEffect(() => {
    fetchVIPs();
  }, [broadcasterId]);
  
  const fetchVIPs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if user is authenticated
      if (typeof window === 'undefined' || !window.getTwitchAuth) {
        throw new Error('Authentication required to view VIPs');
      }
      
      const authData = window.getTwitchAuth();
      if (!authData || !authData.token) {
        throw new Error('Please connect with Twitch to view VIPs');
      }
      
      // Fetch VIPs data
      const response = await getChannelVIPs(broadcasterId, {}, authData.token);
      
      if (response && response.data) {
        setVips(response.data);
      } else {
        setVips([]);
      }
    } catch (err) {
      console.error('Error fetching VIPs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load VIPs');
      setVips([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle clicking on a VIP's profile
  const handleVIPClick = (vipName: string) => {
    trackClick('twitch', `view-vip-profile-${vipName}`);
    window.open(`https://twitch.tv/${vipName}`, '_blank');
  };
  
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-pink mb-2"></div>
        <p className="text-sm">Loading VIPs...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="neo-card neo-card-pink p-4 bg-red-900/30">
          <p className="text-sm text-red-200">{error}</p>
          {error.includes('connect') && (
            <button 
              onClick={() => window.loginWithTwitch?.(['channel:read:vips'])}
              className="mt-2 px-3 py-1 bg-neon-pink/30 text-white text-sm rounded hover:bg-neon-pink/50 transition"
            >
              Connect with Twitch
            </button>
          )}
        </div>
      </div>
    );
  }
  
  if (vips.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-gray-400">No VIPs found for this channel</p>
      </div>
    );
  }
  
  return (
    <div className="vips-list">
      <h3 className="text-lg font-cyber neon-text pink mb-3 flex items-center">
        <FaCrown className="mr-2" /> {broadcasterName}'s VIPs ({vips.length})
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {vips.map(vip => (
          <div 
            key={vip.user_id}
            className="neo-card neo-card-pink p-2 cursor-pointer hover:bg-neon-pink/20 transition"
            onClick={() => handleVIPClick(vip.user_login)}
          >
            <div className="flex items-center">
              <div className="mr-2 text-neon-pink">
                <FaUser size={14} />
              </div>
              <div className="flex-1 truncate text-sm">
                {vip.user_name}
              </div>
              <div className="text-gray-400">
                <FaExternalLinkAlt size={10} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TwitchVIPsList;
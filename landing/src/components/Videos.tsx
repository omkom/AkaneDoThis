import React, { useEffect, useState, useCallback } from 'react';
import { FaCalendarAlt, FaClock, FaGamepad, FaBell, FaExternalLinkAlt, FaTwitch, FaPlayCircle, FaEye } from 'react-icons/fa';
import { trackClick } from '../utils/analytics';
import { getVideos, TwitchVideo } from '../../services/twitch/twitch-api';
import { formatThumbnailUrl } from '../../services/twitch/twitch-client';

// Constants
const BROADCASTER_ID = '400615151'; // AkaneDoThis ID
const DEFAULT_VIDEOS = [
  { title: 'Cyberpunk 2077 - Any% en 3:45:22', type: 'Speedrun' },
  { title: 'Création d\'un Jeu Cyberpunk en 48 Heures', type: 'Programmation Créative' },
  { title: 'Techniques Avancées de Speedrun', type: 'Série Tutoriels' },
  { title: 'Meilleurs Moments des Jeux Communautaires', type: 'Moments Communautaires' }
];

// Format video duration (converts "1h2m3s" to "1:02:03")
const formatDuration = (duration: string): string => {
  // Parse duration string like "1h2m3s"
  const hours = duration.match(/(\d+)h/);
  const minutes = duration.match(/(\d+)m/);
  const seconds = duration.match(/(\d+)s/);
  
  const h = hours ? parseInt(hours[1]) : 0;
  const m = minutes ? parseInt(minutes[1]).toString().padStart(2, '0') : '00';
  const s = seconds ? parseInt(seconds[1]).toString().padStart(2, '0') : '00';
  
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
};

// Format publication date
const formatPublishedDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Determine card color based on title or index
const getCardColor = (video: TwitchVideo, index: number): string => {
  const title = video.title.toLowerCase();
  
  if (title.includes('speedrun')) return 'blue';
  if (title.includes('code') || title.includes('programme') || title.includes('dev')) return 'pink';
  if (title.includes('communautaire') || title.includes('gaming')) return 'purple';
  
  // Fallback to alternating colors for visual variety
  const colors = ['pink', 'blue', 'purple', 'lime'];
  return colors[index % colors.length];
};

export default function Videos() {
  const [recentVideos, setRecentVideos] = useState<TwitchVideo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch recent broadcasts from Twitch API
  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getVideos(BROADCASTER_ID, {
        type: 'archive', // Past broadcasts only
        first: 4, // Limit to 4 videos
        sort: 'time' // Sort by time (most recent first)
      });
      
      if (response && response.data && response.data.length > 0) {
        setRecentVideos(response.data);
      } else {
        console.log('No videos found, using defaults');
      }
    } catch (err) {
      console.error('Error fetching recent broadcasts:', err);
      setError('Unable to load recent broadcasts');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load videos on component mount
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);
  
  // Handle video click
  const handleVideoClick = (videoUrl: string, title: string) => {
    trackClick('videos', 'watch-broadcast', title);
    window.open(videoUrl, '_blank');
  };
  
  // Create video cards
  const createVideoCards = () => {
    // If we have videos from the API, use those
    if (recentVideos.length > 0) {
      return recentVideos.map((video, index) => {
        const color = getCardColor(video, index);
        const thumbnailUrl = video.thumbnail_url ? 
          formatThumbnailUrl(video.thumbnail_url.replace('%{width}x%{height}', '320x180'), 320, 180) : 
          '';
        
        return (
          <div className="card-3d-container" key={video.id}>
            <div className={`neo-card neo-card-${color} card-3d p-6 flex flex-col h-full`}>
              <div className="flex justify-between items-start mb-3">
                <h3 className={`neon-text ${color === 'blue' ? 'cyan' : color} text-xl font-cyber flex items-center`}>
                  <FaPlayCircle className="mr-2" />
                  Past Broadcast
                </h3>
                <span className="text-sm bg-black/30 px-2 py-1 rounded font-body flex items-center">
                  <FaClock className="mr-1" /> {formatDuration(video.duration)}
                </span>
              </div>
              
              <div className="aspect-video bg-black/70 mb-4 relative overflow-hidden group cursor-pointer"
                   onClick={() => handleVideoClick(video.url, video.title)}>
                {thumbnailUrl ? (
                  <img 
                    src={thumbnailUrl} 
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="text-center p-8 h-full flex items-center justify-center">
                    <p className={`text-${color === 'blue' ? 'electric-blue' : color === 'pink' ? 'neon-pink' : color === 'purple' ? 'bright-purple' : 'vivid-lime'} font-cyber mb-2`}>
                      Miniature Vidéo
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className={`text-${color === 'blue' ? 'electric-blue' : color === 'pink' ? 'neon-pink' : color === 'purple' ? 'bright-purple' : 'vivid-lime'} text-4xl`}>
                    <FaPlayCircle />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center">
                  <FaEye className="mr-1" /> {video.view_count.toLocaleString()}
                </div>
              </div>

              <h4 className="text-lg font-semibold mb-2 line-clamp-2">{video.title}</h4>
              
              <p className="text-sm mb-4 flex items-center text-gray-300">
                <FaCalendarAlt className="mr-1" /> {formatPublishedDate(video.published_at)}
              </p>
              
              <div className="mt-auto pt-4 flex justify-center">
                <button
                  onClick={() => handleVideoClick(video.url, video.title)}
                  className={`text-sm px-3 py-1 flex items-center justify-center border-2 border-${color === 'blue' ? 'electric-blue' :
                    color === 'pink' ? 'neon-pink' :
                    color === 'purple' ? 'bright-purple' : 'vivid-lime'}
                    hover:bg-${color === 'blue' ? 'electric-blue' :
                    color === 'pink' ? 'neon-pink' :
                    color === 'purple' ? 'bright-purple' : 'vivid-lime'}/20 transition`}
                >
                  <FaPlayCircle className="mr-1" /> Regarder
                </button>
              </div>
            </div>
          </div>
        );
      });
    } else {
      // Fallback to default videos if API didn't return any
      return DEFAULT_VIDEOS.map((item, index) => {
        const colors = ['pink', 'blue', 'purple', 'lime'];
        const color = colors[index % colors.length];
        
        return (
          <div className="card-3d-container" key={index}>
            <div className={`neo-card neo-card-${color} card-3d p-6`}>
              <h3 className={`neon-text ${color === 'blue' ? 'cyan' : color} text-xl mb-4 font-cyber`}>{item.type}</h3>
              <div className="aspect-video bg-black/70 mb-4 flex items-center justify-center">
                <div className="text-center p-8">
                  <p className={`text-${color === 'blue' ? 'electric-blue' : color === 'pink' ? 'neon-pink' : color === 'purple' ? 'bright-purple' : 'vivid-lime'} font-cyber mb-2`}>
                    Miniature Vidéo
                  </p>
                  <p className="font-body text-sm">{item.title}</p>
                </div>
              </div>
              <p className="mb-4 font-body">Regardez-moi en action avec ce contenu exclusif et rejoignez la communauté.</p>
              <a href="#" className={`inline-block px-6 py-2 border-2 border-${color === 'blue' ? 'electric-blue' : color === 'pink' ? 'neon-pink' : color === 'purple' ? 'bright-purple' : 'vivid-lime'} text-white hover:bg-${color === 'blue' ? 'electric-blue' : color === 'pink' ? 'neon-pink' : color === 'purple' ? 'bright-purple' : 'vivid-lime'}/20 transition duration-300 font-cyber`}>
                Regarder
              </a>
            </div>
          </div>
        );
      });
    }
  };

  return (
    <section id="videos" className="py-20 bg-black/50">
      <div className="container mx-auto px-4">
        <h2 className="neon-text purple text-center text-4xl mb-12 font-cyber">Contenu à la Une</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-bright-purple"></div>
            <span className="ml-2">Chargement des vidéos...</span>
          </div>
        ) : (
          <>
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
              {createVideoCards()}
            </div>
            
            {error && (
              <div className="my-4 p-3 bg-red-900/30 border border-red-500 text-red-200 rounded-lg text-center">
                {error}
              </div>
            )}
            
            <div className="text-center mt-12">
              <a 
                href="https://www.twitch.tv/akanedothis/videos" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => trackClick('videos', 'view-all')}
                className="inline-block px-8 py-3 border-2 border-neon-pink text-white bg-black/30 hover:bg-neon-pink/20 transition duration-300 font-cyber"
              >
                <FaTwitch className="inline-block mr-2" />
                Voir Toutes les Vidéos
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
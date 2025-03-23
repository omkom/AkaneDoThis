import { useState, useEffect, useRef, useCallback } from 'react';
import React from 'react';
import StreamerSpotlight from './Twitch/StreamerSpotlight';
import './css/hero.css';
import { getStreamInfo } from '../../services/twitch/twitch-api';
import { isDebugLiveEnabled } from '../utils/twitch-debug';
import { trackClick } from '../utils/analytics';

// Constants
const CHANNEL_NAME = 'akanedothis';
const STREAM_CHECK_INTERVAL = 60000; // Check every minute if stream is live

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [embedExpanded, setEmbedExpanded] = useState(false);
  const [embedMuted, setEmbedMuted] = useState(true);
  const streamCheckerRef = useRef<NodeJS.Timeout | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  
  // Check if the stream is live
  const checkStreamStatus = useCallback(async () => {
    try {
      // If debug live mode is enabled, skip the API call
      if (process.env.NODE_ENV !== 'production' && isDebugLiveEnabled()) {
        setIsLive(true);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const streamData = await getStreamInfo(CHANNEL_NAME);
      setIsLive(!!streamData);
    } catch (err) {
      console.error('Error checking stream status:', err);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      }
    };
    
    // Track scroll position
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Initial stream check and set up interval
  useEffect(() => {
    // Check stream status on component mount
    checkStreamStatus();
    
    // Set up interval to periodically check stream status
    streamCheckerRef.current = setInterval(checkStreamStatus, STREAM_CHECK_INTERVAL);
    
    // Clear interval on component unmount
    return () => {
      if (streamCheckerRef.current) {
        clearInterval(streamCheckerRef.current);
      }
    };
  }, [checkStreamStatus]);
  
  // Calculate glitch intensity based on scroll
  const glitchIntensity = Math.min(scrollPosition / 500, 1);
  
  // Handle Twitch embed events
  const handleEmbedReady = () => {
    console.log('Twitch embed ready');
  };
  
  const handleEmbedPlay = () => {
    console.log('Twitch embed playing');
    // Track play event
    trackClick('twitch', 'embed-play');
  };
  
  const handleEmbedOffline = () => {
    console.log('Stream is offline');
    setIsLive(false);
  };
  
  // Toggle embed size
  const toggleEmbedSize = () => {
    setEmbedExpanded(!embedExpanded);
    trackClick('twitch', embedExpanded ? 'embed-collapse' : 'embed-expand');
  };
  
  // Toggle mute state
  const toggleMute = () => {
    setEmbedMuted(!embedMuted);
    trackClick('twitch', embedMuted ? 'embed-unmute' : 'embed-mute');
  };
  
  return (
    <section 
      id="home" 
      ref={heroRef}
      className="hero min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-jet-black relative overflow-hidden"
    >
      {isLoading ? (
        <div className="absolute top-4 right-4 z-10 text-white bg-black/50 rounded px-3 py-2 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-neon-pink mr-2"></div>
          <span className="text-sm font-cyber">Checking stream...</span>
        </div>
      ) : isLive && (
        <div 
          className={`absolute z-10 top-0 left-0 right-0 transition-all duration-500 ease-in-out ${
            embedExpanded ? 'h-screen' : 'h-3/5 lg:h-2/3'
          }`}
        >
          <div className="relative w-full h-full">
            {/* "Live Now" badge */}
            <div className="absolute top-4 left-4 flex items-center bg-red-600/90 text-white px-3 py-1 rounded-full text-sm font-cyber">
              <span className="relative flex h-3 w-3 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              LIVE NOW
            </div>
          </div>
        </div>
      )}
      
      <div className={`hero-content text-center z-10 px-4 transition-all duration-500 ${
        isLive && !embedExpanded ? 'mt-64 lg:mt-96' : isLive && embedExpanded ? 'opacity-0 pointer-events-none' : ''
      }`}>
        <div className="mb-8 mx-auto w-40 h-40 rounded-full overflow-hidden border-4 border-neon-pink glow-effect">
          <img 
            src="https://static-cdn.jtvnw.net/jtv_user_pictures/258e0f7f-cdd0-4ab8-89f2-82d97993f474-profile_image-300x300.png"
            alt="AkaneDoThis" 
            className="w-full h-full object-cover"
          />
        </div>
        <h1 
          className="font-cyber text-5xl md:text-7xl font-bold mb-4 tracking-wider glitching-text"
          data-text="AkaneDoThis"
          style={{
            position: "relative",
            fontFamily: "'Orbitron', sans-serif",
            color: "#f6d8d5"
          }}
        >
          AkaneDoThis
        </h1>
        <p className="font-body text-xl md:text-2xl mb-8 text-electric-blue tracking-wide">Diffuser le futur, un pixel à la fois</p>
        
        {/* StreamerSpotlight with integrated follow button and subscribers */}
        <StreamerSpotlight isLive={isLive} />
      </div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Scan lines effect */}
        <div className="scan-lines"></div>
        
        {/* Neon geometric frames */}
        <div className="neon-frame neon-frame-top"></div>
        <div className="neon-frame neon-frame-bottom"></div>
        
        {/* Original effects with reduced opacity */}
        <div className="neon-grid opacity-30"></div>
        <div className="cyber-particles opacity-30"></div>
        
        {/* Always-on glitch overlay */}
        <div className="glitch-overlay active"></div>
        
        {/* Always-on hacked screen distortion effects */}
        <div className="hacked-screen active"></div>
        <div className="digital-noise active"></div>
        <div className="glitch-blocks active"></div>
        <div className="distortion-wave active"></div>
        
        {/* Always-on full-width glitch layers */}
        <div className="full-width-glitch glitch-layer-1 active"></div>
        <div className="full-width-glitch glitch-layer-2 active"></div>
        <div className="full-width-glitch glitch-layer-3 active"></div>
        
        {/* Always-on RGB split effect */}
        <div className="rgb-split-horizontal active"></div>
        <div className="rgb-split-vertical active"></div>
        
        {/* Always-on scanline intensifier */}
        <div className="scanline-intensifier active"></div>
        
        {/* Always-on static noise overlay */}
        <div className="static-noise active"></div>
        
        {/* Always-on pixel sorting effect */}
        <div className="pixel-sort active"></div>
        
        {/* New mouse-reactive glitch layers */}
        <div 
          className="mouse-reactive-glitch" 
          style={{
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            opacity: 0.7
          }}
        ></div>
        
        {/* New scroll-reactive noise layers */}
        <div 
          className="scroll-reactive-noise" 
          style={{
            opacity: glitchIntensity * 0.3
          }}
        ></div>
        
        {/* Additional "neige" (snow/noise) layers */}
        <div className="neige-layer neige-layer-1"></div>
        <div className="neige-layer neige-layer-2"></div>
        <div className="neige-layer neige-layer-3"></div>
        
        {/* Random glitch blocks that appear and disappear */}
        <div className="random-glitch-block block-1"></div>
        <div className="random-glitch-block block-2"></div>
        <div className="random-glitch-block block-3"></div>
        <div className="random-glitch-block block-4"></div>
        
        {/* VHS tracking lines */}
        <div className="vhs-tracking"></div>
        
        {/* Digital artifacts */}
        <div className="digital-artifacts"></div>
      </div>
    </section>
  );
}
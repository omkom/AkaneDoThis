import { useState, useEffect } from 'react';
import { FaYoutube, FaTiktok, FaInstagram, FaDiscord, FaTwitch } from 'react-icons/fa';
import { trackClick } from '../utils/analytics';
import React from 'react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  
  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      // Update header background
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
      
      // Determine active section based on scroll position
      const sections = ['home', 'story', 'schedule', 'videos', 'twitch', 'community', 'contact'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const handleNavClick = (section: string) => {
    // Track navigation click
    trackClick('navigation', section);
    
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleSocialClick = (platform: string, url: string) => {
    // Track social media click
    trackClick('social', platform, url);
  };
  
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'} bg-black/90 backdrop-blur-md`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo with clean cyberpunk typography */}
          <a href="#" className="text-2xl font-bold font-cyber">
            <span className="text-electric-blue neon-text blue">Akane</span>
            <span className="text-neon-pink neon-text pink">DoThis</span>
          </a>
          
          {/* Desktop Navigation with border-bottom hover effect */}
          <nav className="hidden md:flex items-center space-x-8 relative">
            <a 
              href="#home" 
              className={`text-white hover:text-neon-pink transition-all duration-300 font-cyber relative py-2 ${activeSection === 'home' ? 'text-neon-pink' : ''}`}
              onClick={() => handleNavClick('home')}
            >
              <span className="relative">
                Accueil
                <span className={`absolute left-0 bottom-0 w-0 h-0.5 bg-neon-pink transition-all duration-300 ${activeSection === 'home' ? 'w-full' : 'group-hover:w-full'}`}></span>
              </span>
              {activeSection === 'home' && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-neon-pink"></span>
              )}
            </a>
            <a 
              href="#story" 
              className={`text-white hover:text-electric-blue transition-all duration-300 font-cyber relative py-2 group ${activeSection === 'story' ? 'text-electric-blue' : ''}`}
              onClick={() => handleNavClick('story')}
            >
              <span className="relative">
                Histoire
                <span className={`absolute left-0 bottom-0 w-0 h-0.5 bg-electric-blue transition-all duration-300 ${activeSection === 'story' ? 'w-full' : 'group-hover:w-full'}`}></span>
              </span>
              {activeSection === 'story' && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-electric-blue"></span>
              )}
            </a>
            <a 
              href="#schedule" 
              className={`text-white hover:text-vivid-lime transition-all duration-300 font-cyber relative py-2 group ${activeSection === 'schedule' ? 'text-vivid-lime' : ''}`}
              onClick={() => handleNavClick('schedule')}
            >
              <span className="relative">
                Programme
                <span className={`absolute left-0 bottom-0 w-0 h-0.5 bg-vivid-lime transition-all duration-300 ${activeSection === 'schedule' ? 'w-full' : 'group-hover:w-full'}`}></span>
              </span>
              {activeSection === 'schedule' && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-vivid-lime"></span>
              )}
            </a>
            <a 
              href="#videos" 
              className={`text-white hover:text-bright-purple transition-all duration-300 font-cyber relative py-2 group ${activeSection === 'videos' ? 'text-bright-purple' : ''}`}
              onClick={() => handleNavClick('videos')}
            >
              <span className="relative">
                Vidéos
                <span className={`absolute left-0 bottom-0 w-0 h-0.5 bg-bright-purple transition-all duration-300 ${activeSection === 'videos' ? 'w-full' : 'group-hover:w-full'}`}></span>
              </span>
              {activeSection === 'videos' && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-bright-purple"></span>
              )}
            </a>
            {/* New Twitch Menu Item */}
            <a 
              href="#twitch" 
              className={`text-white hover:text-neon-cyan transition-all duration-300 font-cyber relative py-2 group ${activeSection === 'twitch' ? 'text-neon-cyan' : ''}`}
              onClick={() => handleNavClick('twitch')}
            >
              <span className="relative flex items-center">
                <FaTwitch className="mr-1" />
                Twitch
                <span className={`absolute left-0 bottom-0 w-0 h-0.5 bg-neon-cyan transition-all duration-300 ${activeSection === 'twitch' ? 'w-full' : 'group-hover:w-full'}`}></span>
              </span>
              {activeSection === 'twitch' && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-neon-cyan"></span>
              )}
            </a>
            <a 
              href="#community" 
              className={`text-white hover:text-neon-pink transition-all duration-300 font-cyber relative py-2 group ${activeSection === 'community' ? 'text-neon-pink' : ''}`}
              onClick={() => handleNavClick('community')}
            >
              <span className="relative">
                Communauté
                <span className={`absolute left-0 bottom-0 w-0 h-0.5 bg-neon-pink transition-all duration-300 ${activeSection === 'community' ? 'w-full' : 'group-hover:w-full'}`}></span>
              </span>
              {activeSection === 'community' && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-neon-pink"></span>
              )}
            </a>
            <a 
              href="#contact" 
              className={`text-white hover:text-electric-blue transition-all duration-300 font-cyber relative py-2 group ${activeSection === 'contact' ? 'text-electric-blue' : ''}`}
              onClick={() => handleNavClick('contact')}
            >
              <span className="relative">
                Contact
                <span className={`absolute left-0 bottom-0 w-0 h-0.5 bg-electric-blue transition-all duration-300 ${activeSection === 'contact' ? 'w-full' : 'group-hover:w-full'}`}></span>
              </span>
              {activeSection === 'contact' && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-electric-blue"></span>
              )}
            </a>
          </nav>
          
          {/* Social Icons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <a 
              href="https://www.twitch.tv/akanedothis" 
              className="text-white hover:text-neon-pink transition"
              onClick={() => handleSocialClick('twitch', 'https://www.twitch.tv/akanedothis')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTwitch className="w-5 h-5" />
            </a>
            
            <a 
              href="https://discord.gg/H67aXsYNa7" 
              className="text-white hover:text-bright-purple transition"
              onClick={() => handleSocialClick('discord', 'https://discord.gg/H67aXsYNa7')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaDiscord className="w-5 h-5" />
            </a>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 card-3d-container">
            <div className="neo-card neo-card-pink card-3d p-4">
              <nav className="flex flex-col space-y-4">
                <a 
                  href="#home" 
                  className={`text-white hover:text-neon-pink transition-all duration-300 font-cyber relative py-1 group ${activeSection === 'home' ? 'text-neon-pink' : ''}`} 
                  onClick={() => handleNavClick('home')}
                >
                  <span className="relative">
                    Accueil
                    <span className={`absolute left-0 bottom-0 w-0 h-0.5 bg-neon-pink transition-all duration-300 ${activeSection === 'home' ? 'w-full' : 'group-hover:w-full'}`}></span>
                  </span>
                </a>
                <a 
                  href="#story" 
                  className={`text-white hover:text-electric-blue transition-all duration-300 font-cyber relative py-1 group ${activeSection === 'story' ? 'text-electric-blue' : ''}`} 
                  onClick={() => handleNavClick('story')}
                >
                  <span className="relative">
                    Histoire
                    <span className={`absolute left-0 bottom-0 w-0 h-0.5 bg-electric-blue transition-all duration-300 ${activeSection === 'story' ? 'w-full' : 'group-hover:w-full'}`}></span>
                  </span>
                </a>
                <a 
                  href="#schedule" 
                  className={`text-white hover:text-vivid-lime transition-all duration-300 font-cyber relative py-1 group ${activeSection === 'schedule' ? 'text-vivid-lime' : ''}`} 
                  onClick={() => handleNavClick('schedule')}
                >
                  <span className="relative">
                    Programme
                    <span className={`absolute left-0 bottom-0 w-0 h-0.5 bg-vivid-lime transition-all duration-300 ${activeSection === 'schedule' ? 'w-full' : 'group-hover:w-full'}`}></span>
                  </span>
                </a>
                <a 
                  href="#videos" 
                  className={`text-white hover:text-bright-purple transition-all duration-300 font-cyber relative py-1 group ${activeSection === 'videos' ? 'text-bright-purple' : ''}`} 
                  onClick={() => handleNavClick('videos')}
                >
                  <span className="relative">
                    Vidéos
                    <span className={`absolute left-0 bottom-0 w-0 h-0.5 bg-bright-purple transition-all duration-300 ${activeSection === 'videos' ? 'w-full' : 'group-hover:w-full'}`}></span>
                  </span>
                </a>
                {/* New Twitch Menu Item for Mobile */}
                <a 
                  href="#twitch" 
                  className={`text-white hover:text-neon-cyan transition-all duration-300 font-cyber relative py-1 group ${activeSection === 'twitch' ? 'text-neon-cyan' : ''}`} 
                  onClick={() => handleNavClick('twitch')}
                >
                  <span className="relative flex items-center">
                    <FaTwitch className="mr-1" />
                    Twitch
                    <span className={`absolute left-0 bottom-0 w-0 h-0.5 bg-neon-cyan transition-all duration-300 ${activeSection === 'twitch' ? 'w-full' : 'group-hover:w-full'}`}></span>
                  </span>
                </a>
                <a 
                  href="#community" 
                  className={`text-white hover:text-neon-pink transition-all duration-300 font-cyber relative py-1 group ${activeSection === 'community' ? 'text-neon-pink' : ''}`} 
                  onClick={() => handleNavClick('community')}
                >
                  <span className="relative">
                    Communauté
                    <span className={`absolute left-0 bottom-0 w-0 h-0.5 bg-neon-pink transition-all duration-300 ${activeSection === 'community' ? 'w-full' : 'group-hover:w-full'}`}></span>
                  </span>
                </a>
                <a 
                  href="#contact" 
                  className={`text-white hover:text-electric-blue transition-all duration-300 font-cyber relative py-1 group ${activeSection === 'contact' ? 'text-electric-blue' : ''}`} 
                  onClick={() => handleNavClick('contact')}
                >
                  <span className="relative">
                    Contact
                    <span className={`absolute left-0 bottom-0 w-0 h-0.5 bg-electric-blue transition-all duration-300 ${activeSection === 'contact' ? 'w-full' : 'group-hover:w-full'}`}></span>
                  </span>
                </a>
                
                <div className="flex space-x-4 pt-4 border-t border-white/20">
                  <a 
                    href="https://www.twitch.tv/akanedothis" 
                    className="text-white hover:text-neon-pink transition"
                    onClick={() => handleSocialClick('twitch', 'https://www.twitch.tv/akanedothis')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaTwitch className="w-5 h-5" />
                  </a>
                  <a 
                    href="https://www.youtube.com/@Akane.DoThis" 
                    className="text-white hover:text-electric-blue transition"
                    onClick={() => handleSocialClick('youtube', 'https://www.youtube.com/@Akane.DoThis')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaYoutube className="w-5 h-5" />
                  </a>
                  <a 
                    href="https://discord.gg/H67aXsYNa7" 
                    className="text-white hover:text-bright-purple transition"
                    onClick={() => handleSocialClick('discord', 'https://discord.gg/H67aXsYNa7')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaDiscord className="w-5 h-5" />
                  </a>
                  <a 
                    href="https://www.tiktok.com/@akanedothis" 
                    className="text-white hover:text-vivid-lime transition"
                    onClick={() => handleSocialClick('tiktok', 'https://www.tiktok.com/@akanedothis')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaTiktok className="w-5 h-5" />
                  </a>
                  <a 
                    href="https://www.instagram.com/_akanedothis/" 
                    className="text-white hover:text-neon-pink transition"
                    onClick={() => handleSocialClick('instagram', 'https://www.instagram.com/_akanedothis/')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaInstagram className="w-5 h-5" />
                  </a>
                </div>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
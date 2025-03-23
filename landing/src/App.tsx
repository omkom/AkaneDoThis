import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Story from './components/Story';
import Schedule from './components/Schedule';
import Videos from './components/Videos';
import Community from './components/Community';
import Contact from './components/Contact';
import Footer from './components/Footer';
//import TwitchIntegration from './components/Twitch/TwitchIntegration';
import { trackPageView, trackFormSubmit } from './utils/analytics';
import TwitchApiLogger from './components/Twitch/TwitchApiLogger';
import { setupEnvironment, getEnv } from './utils/env-config';

import './components/css/twitch-embed.css';

// Import assets
import React from 'react';

export default function App() {
  const [email, setEmail] = useState('');
  const [isEnvInitialized, setIsEnvInitialized] = useState(false);

  // Initialize environment configuration
  useEffect(() => {
    // Set up environment variables first thing
    const env = setupEnvironment({
      // Add your development Twitch Client ID here for local development
      // In production, this should come from the server's environment variables
      TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID || window.TWITCH_CLIENT_ID || "",
      VITE_TWITCH_CLIENT_ID: process.env.VITE_TWITCH_CLIENT_ID || ""
    });
    
    console.log("Environment initialized:", {
      TWITCH_CLIENT_ID: getEnv('TWITCH_CLIENT_ID'),
      VITE_TWITCH_CLIENT_ID: getEnv('VITE_TWITCH_CLIENT_ID'),
      globalTwitchClientId: window.TWITCH_CLIENT_ID
    });
    
    setIsEnvInitialized(true);
    
    // Track page view
    trackPageView(window.location.pathname, document.title);
    
    // Track page changes
    const handleRouteChange = () => {
      trackPageView(window.location.pathname, document.title);
    };

    // Listen for hash changes (since this is a single page app with hash navigation)
    window.addEventListener('hashchange', handleRouteChange);
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track form submission
    trackFormSubmit('newsletter_signup', { 
      email: email,
      source: 'footer_form'
    });
    
    // Handle email submission logic
    console.log('Email submitted:', email);
    setEmail('');
  };

  if (!isEnvInitialized) {
    return (
      <div className="min-h-screen bg-jet-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-cyber neon-text cyan mb-4">Initializing Environment...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-electric-blue mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jet-black text-white">
      <Header />
      <Hero />
      <Story />
      <Videos />
      <Schedule />
      
      {/* Add Twitch Integration Section 
      <section id="twitch" className="py-20 bg-black/70">
        <div className="container mx-auto px-4">
          <h2 className="neon-text cyan text-center text-4xl mb-12 font-cyber">Stream with Me</h2>
          <div className="max-w-4xl mx-auto">
            <TwitchIntegration />
          </div>
        </div>
      </section>*/}
      
      <Community />
      <Contact />
      
      {/* Email Capture - Floating */}
      <section className="email-capture py-16 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-4 text-center">
          <h2 className="neon-text purple text-3xl mb-6">Recevez des Mises à Jour Neuro-Améliorées</h2>
          <form onSubmit={handleSubmit} className="email-form max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Entrez votre email"
              required
              className="flex-1 p-3 bg-black/70 border-2 border-bright-purple focus:border-neon-pink outline-none transition"
            />
            <button type="submit" className="px-6 py-3 bg-bright-purple text-white hover:bg-neon-pink transition duration-300">
              S'abonner
            </button>
          </form>
        </div>
      </section>
      
      <Footer />

      {process.env.NODE_ENV === 'development' && <TwitchApiLogger />}
    </div>
  );
}
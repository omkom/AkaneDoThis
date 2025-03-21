import Header from './components/Header';
import Hero from './components/Hero';
import Story from './components/Story';
import Schedule from './components/Schedule';
import Videos from './components/Videos';
import Community from './components/Community';
import Contact from './components/Contact';
import Footer from './components/Footer';
import { useState, useEffect } from 'react';
import { trackPageView, trackFormSubmit } from './utils/analytics';
//import { FaYoutube, FaTiktok, FaInstagram, FaDiscord, FaDonate } from 'react-icons/fa';
import twitchRoutes from './routes/twitch.js';

export default function App() {
  const [email, setEmail] = useState('');

  // Track page view when component mounts
  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-jet-black text-white">
      <Header />
      <Hero />
      <Story />
      <Schedule />
      <Videos />
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
    </div>
  );
}
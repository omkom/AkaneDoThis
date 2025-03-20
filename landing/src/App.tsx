import Header from './components/Header';
import Hero from './components/Hero';
import Story from './components/Story';
import Schedule from './components/Schedule';
import Videos from './components/Videos';
import Community from './components/Community';
import Contact from './components/Contact';
import Footer from './components/Footer';
import { useState } from 'react';
//import { FaYoutube, FaTiktok, FaInstagram, FaDiscord, FaDonate } from 'react-icons/fa';

export default function App() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email submission
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
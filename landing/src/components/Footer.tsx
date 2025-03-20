import { FaYoutube, FaTiktok, FaInstagram, FaDiscord, FaTwitch } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="py-12 bg-black">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="mb-6 md:mb-0">
            <h2 className="text-3xl font-bold neon-text pink font-cyber mb-2">AkaneDoThis</h2>
            <p className="text-gray-400 font-body">Diffuser le futur, un pixel à la fois.</p>
          </div>
          
          <div className="flex space-x-6">
            <a href="https://www.twitch.tv/akanedothis" className="text-white hover:text-neon-pink transition">
              <FaTwitch className="w-6 h-6" />
            </a>
            <a href="https://www.youtube.com/channel/UC3V_KcrCA284LW8efv1L3aw" className="text-white hover:text-electric-blue transition">
              <FaYoutube className="w-6 h-6" />
            </a>
            <a href="https://discord.gg/H67aXsYNa7" className="text-white hover:text-bright-purple transition">
              <FaDiscord className="w-6 h-6" />
            </a>
            <a href="https://www.tiktok.com/@akanedothis" className="text-white hover:text-vivid-lime transition">
              <FaTiktok className="w-6 h-6" />
            </a>
            <a href="https://www.instagram.com/_akanedothis/" className="text-white hover:text-neon-pink transition">
              <FaInstagram className="w-6 h-6" />
            </a>
          </div>
        </div>
        
        <div className="card-3d-container">
          <div className="neo-card neo-card-blue card-3d p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4 neon-text cyan font-cyber">Navigation</h3>
                <ul className="space-y-2 font-body">
                  <li><a href="#home" className="hover:text-electric-blue transition">Accueil</a></li>
                  <li><a href="#story" className="hover:text-electric-blue transition">Mon Histoire</a></li>
                  <li><a href="#schedule" className="hover:text-electric-blue transition">Programme</a></li>
                  <li><a href="#videos" className="hover:text-electric-blue transition">Vidéos</a></li>
                  <li><a href="#community" className="hover:text-electric-blue transition">Communauté</a></li>
                  <li><a href="#contact" className="hover:text-electric-blue transition">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4 neon-text purple font-cyber">Ressources</h3>
                <ul className="space-y-2 font-body">
                  <li><a href="#" className="hover:text-bright-purple transition">Boutique</a></li>
                  <li><a href="#" className="hover:text-bright-purple transition">Guides Speedrun</a></li>
                  <li><a href="#" className="hover:text-bright-purple transition">Tutoriels de Code</a></li>
                  <li><a href="#" className="hover:text-bright-purple transition">Config Stream</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4 neon-text lime font-cyber">Mentions Légales</h3>
                <ul className="space-y-2 font-body">
                  <li><a href="#" className="hover:text-vivid-lime transition">Politique de Confidentialité</a></li>
                  <li><a href="#" className="hover:text-vivid-lime transition">Conditions d'Utilisation</a></li>
                  <li><a href="#" className="hover:text-vivid-lime transition">Politique des Cookies</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center text-gray-500 font-body">
          <p>&copy; {new Date().getFullYear()} AkaneDoThis. Tous droits réservés.</p>
          <p className="mt-2 text-sm">Conçu avec 💜 dans l'Univers par @cubilizer</p>
        </div>
      </div>
    </footer>
  );
}
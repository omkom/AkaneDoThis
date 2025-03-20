import { FaYoutube, FaTiktok, FaInstagram, FaDiscord, FaTwitch } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="py-12 bg-black">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="mb-6 md:mb-0">
            <h2 className="text-3xl font-bold neon-text pink font-cyber mb-2">AkaneDoThis</h2>
            <p className="text-gray-400 font-body">Streaming the future, one pixel at a time.</p>
          </div>
          
          <div className="flex space-x-6">
            <a href="#" className="text-white hover:text-neon-pink transition">
              <FaTwitch className="w-6 h-6" />
            </a>
            <a href="#" className="text-white hover:text-electric-blue transition">
              <FaYoutube className="w-6 h-6" />
            </a>
            <a href="#" className="text-white hover:text-bright-purple transition">
              <FaDiscord className="w-6 h-6" />
            </a>
            <a href="#" className="text-white hover:text-vivid-lime transition">
              <FaTiktok className="w-6 h-6" />
            </a>
            <a href="#" className="text-white hover:text-neon-pink transition">
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
                  <li><a href="#home" className="hover:text-electric-blue transition">Home</a></li>
                  <li><a href="#story" className="hover:text-electric-blue transition">My Story</a></li>
                  <li><a href="#schedule" className="hover:text-electric-blue transition">Schedule</a></li>
                  <li><a href="#videos" className="hover:text-electric-blue transition">Videos</a></li>
                  <li><a href="#community" className="hover:text-electric-blue transition">Community</a></li>
                  <li><a href="#contact" className="hover:text-electric-blue transition">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4 neon-text purple font-cyber">Resources</h3>
                <ul className="space-y-2 font-body">
                  <li><a href="#" className="hover:text-bright-purple transition">Merch Store</a></li>
                  <li><a href="#" className="hover:text-bright-purple transition">Speedrun Guides</a></li>
                  <li><a href="#" className="hover:text-bright-purple transition">Coding Tutorials</a></li>
                  <li><a href="#" className="hover:text-bright-purple transition">Stream Setup</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4 neon-text lime font-cyber">Legal</h3>
                <ul className="space-y-2 font-body">
                  <li><a href="#" className="hover:text-vivid-lime transition">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-vivid-lime transition">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-vivid-lime transition">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center text-gray-500 font-body">
          <p>&copy; {new Date().getFullYear()} AkaneDoThis. All rights reserved.</p>
          <p className="mt-2 text-sm">Designed with 💜 in the Cyberpunk universe.</p>
        </div>
      </div>
    </footer>
  );
}

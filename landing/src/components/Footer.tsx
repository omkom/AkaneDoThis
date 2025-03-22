import React from 'react';
import { FaYoutube, FaTiktok, FaInstagram, FaDiscord, FaTwitch } from 'react-icons/fa';

/// Define the background style for your element (e.g. a <footer> in React)
const backgroundStyle = {
  backgroundImage: "url('/chanel-background-large.png')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',  // Centered background image
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
  position: 'fixed',
  width: '100%',   // Full width from left to right
  height: '100vh'  // Full viewport height (adjust as needed)
};

// Create CSS styles for the parallax, 3D effect, distortion, and transparency
const animationStyles = `
  :root {
    --scroll-y: 0;
    --mouse-x: 0;
    --mouse-y: 0;
    --rotateX: 0deg;
    --rotateY: 0deg;
    --skew: 0deg;
    --opacity: 1;
  }
  
  /* Style the target element (here, a footer) */
  footer {
    width: 100%;
    height: 100vh;
    /* Background position moves from center plus adjustments */
    background-position: calc(50% + var(--mouse-x) * 0.5%) calc(50% + var(--scroll-y) * 0.05px + var(--mouse-y) * 0.5%) !important;
    transition: background-position 0.2s ease-out, transform 0.2s ease-out, opacity 0.2s ease-out;
    /* 3D perspective with rotation and skew for distortion */
    transform: perspective(1000px) rotateX(var(--rotateX)) rotateY(var(--rotateY)) skew(var(--skew));
    opacity: var(--opacity);
  }
`;

// Create and append the style element to the document head
const style = document.createElement('style');
style.textContent = animationStyles;
document.head.appendChild(style);

// Update the CSS variable for scroll position
window.addEventListener('scroll', () => {
  document.documentElement.style.setProperty('--scroll-y', window.scrollY);
});

// Update the CSS variables on mouse movement with exponential functions for emphasis
window.addEventListener('mousemove', (e) => {
  // Normalize mouse coordinates (range: -0.5 to 0.5)
  const normalizedX = e.clientX / window.innerWidth - 0.5;
  const normalizedY = e.clientY / window.innerHeight - 0.5;
  
  // Apply exponential emphasis for the parallax effect
  // Multiplying by 20 increases the movement magnitude; adjust as needed
  const expMouseX = Math.sign(normalizedX) * Math.pow(Math.abs(normalizedX), 2) * 20;
  const expMouseY = Math.sign(normalizedY) * Math.pow(Math.abs(normalizedY), 2) * 20;
  document.documentElement.style.setProperty('--mouse-x', expMouseX);
  document.documentElement.style.setProperty('--mouse-y', expMouseY);
  
  // 3D rotation effect based on mouse position using an exponential curve
  const maxRotateX = 10; // Maximum rotation in degrees for the X-axis
  const maxRotateY = 30; // Maximum rotation in degrees for the Y-axis
  
  // For rotateX, the effect intensifies exponentially with vertical position.
  // When the mouse is lower, the element tilts more.
  const expRotateX = (0.5 - Math.pow(e.clientY / window.innerHeight, 2)) * maxRotateX * 2;
  // For rotateY, the effect is based on the horizontal position.
  const expRotateY = (Math.pow(e.clientX / window.innerWidth, 2) - 0.5) * maxRotateY * 2;
  document.documentElement.style.setProperty('--rotateX', expRotateX + 'deg');
  document.documentElement.style.setProperty('--rotateY', expRotateY + 'deg');
  
  // Distortion: a slight skew effect based on horizontal mouse position with exponential emphasis
  const maxSkew = 5; // Maximum skew in degrees
  const expSkew = (Math.pow(e.clientX / window.innerWidth, 2) - 0.5) * maxSkew * 2;
  document.documentElement.style.setProperty('--skew', expSkew + 'deg');
  
  // Transparency: reduce opacity as the mouse moves toward the bottom.
  // Uses an exponential function to have maximum transparency (lowest opacity) at the bottom.
  const relativeY = e.clientY / window.innerHeight;
  const newOpacity = Math.max(1 - Math.pow(relativeY, 2), 0.5);  // Clamp minimum opacity to 0.2
  document.documentElement.style.setProperty('--opacity', newOpacity);
});


export default function Footer() {
  return (
    <footer className="py-12 bg-black">
      <div style={backgroundStyle}> </div>
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
            <a href="https://www.youtube.com/@Akane.DoThis" className="text-white hover:text-electric-blue transition">
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

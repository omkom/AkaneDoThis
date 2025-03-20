/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-pink': '#FF2D95',
        'electric-blue': '#00E0FF',
        'vivid-lime': '#A6FF00',
        'bright-purple': '#9D00FF',
        'jet-black': '#111111',
        'neon-cyan': '#00f3ff',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
      },
      boxShadow: {
        'neon-pink': '0 0 15px #FF2D95',
        'neon-blue': '0 0 15px #00E0FF',
        'neon-lime': '0 0 15px #A6FF00',
        'neon-purple': '0 0 15px #9D00FF',
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #111111 0%, #333333 100%)',
      },
      letterSpacing: {
        'widest': '0.15em',
      }
    },
  },
  plugins: [],
}

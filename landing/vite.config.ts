// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      // Proxy API requests to Express server
      '/api': {
        target: 'http://api:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  define: {
    // Make environment variables available
    'process.env.VITE_TWITCH_CLIENT_ID': JSON.stringify(process.env.VITE_TWITCH_CLIENT_ID)
  }
});
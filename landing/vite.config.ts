// vite.config.ts
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
      // Proxy API requests to Express server running on port 3000
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  define: {
    // Make environment variables available
    'import.meta.env.VITE_TWITCH_CLIENT_ID': JSON.stringify(process.env.VITE_TWITCH_CLIENT_ID || process.env.TWITCH_CLIENT_ID)
  }
});

// landing/vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env files
dotenv.config();

export default defineConfig(({ mode }) => {
  // Load env vars from .env files with Vite's built-in method
  // This properly handles .env, .env.local, .env.[mode], .env.[mode].local
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'PUBLIC_', 'TWITCH_']);
  
  // Expose environment variables to client code
  const envWithProcessPrefix = {};
  Object.entries(env).forEach(([key, val]) => {
    if (key.startsWith('VITE_') || key.startsWith('PUBLIC_') || key === 'TWITCH_CLIENT_ID') {
      envWithProcessPrefix[`process.env.${key}`] = JSON.stringify(val);
    }
  });

  return {
    plugins: [react()],
    
    // Resolve path aliases
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@utils': resolve(__dirname, './src/utils'),
        '@services': resolve(__dirname, './services'),
      },
    },
    
    // Configure dev server
    server: {
      port: 5173,
      proxy: {
        // Proxy API requests to Express server
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    
    // Optimize dependencies
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: ['react', 'react-dom', 'react-icons'],
    },
    
    // Build configuration
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: mode !== 'production',
      minify: mode === 'production',
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor chunks for better caching
            react: ['react', 'react-dom'],
            icons: ['react-icons'],
            twitch: ['./services/twitch/twitch-client.ts', './services/twitch/twitch-api.ts']
          }
        }
      }
    },
    
    // Define global constants
    define: {
      ...envWithProcessPrefix,
      __ENV__: JSON.stringify(mode),
      // Properly replace process.env in client code
      'process.env.NODE_ENV': JSON.stringify(mode),
      'import.meta.env.VITE_TWITCH_CLIENT_ID': JSON.stringify(
        env.VITE_TWITCH_CLIENT_ID || env.TWITCH_CLIENT_ID || ''
      )
    }
  };
});
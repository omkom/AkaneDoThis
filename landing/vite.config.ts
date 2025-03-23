// landing/vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env files
dotenv.config();

export default defineConfig(({ mode }) => {
  // Load env vars from .env files with Vite's built-in method
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'PUBLIC_', 'TWITCH_']);
  
  // Expose environment variables to client code
  const envWithProcessPrefix = {};
  Object.entries(env).forEach(([key, val]) => {
    if (key.startsWith('VITE_') || key.startsWith('PUBLIC_') || key === 'TWITCH_CLIENT_ID') {
      envWithProcessPrefix[`process.env.${key}`] = JSON.stringify(val);
    }
  });

  return {
    root: '.', // Explicitly set the root directory
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
    
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: mode !== 'production',
      minify: mode === 'production',
      target: 'es2020',
    },
    
    // Define global constants
    define: {
      ...envWithProcessPrefix,
      __ENV__: JSON.stringify(mode),
      'process.env.NODE_ENV': JSON.stringify(mode),
      'import.meta.env.VITE_TWITCH_CLIENT_ID': JSON.stringify(
        env.VITE_TWITCH_CLIENT_ID || env.TWITCH_CLIENT_ID || ''
      )
    }
  };
});
// landing/vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { resolve } from 'path';
import fs from 'fs';

// Load environment variables from .env files
dotenv.config();

export default defineConfig(({ mode }) => {
  console.log(`Building for mode: ${mode}`);
  
  // Get environment variables from .env files, process.env and command line
  const env = {
    ...process.env,
    ...loadEnv(mode, process.cwd(), ['VITE_', 'PUBLIC_', 'TWITCH_'])
  };
  
  // Ensure TWITCH_CLIENT_ID is properly set as VITE_TWITCH_CLIENT_ID
  if (env.TWITCH_CLIENT_ID && !env.VITE_TWITCH_CLIENT_ID) {
    env.VITE_TWITCH_CLIENT_ID = env.TWITCH_CLIENT_ID;
    console.log(`Setting VITE_TWITCH_CLIENT_ID from TWITCH_CLIENT_ID: ${env.TWITCH_CLIENT_ID.substring(0, 5)}...`);
  } else if (env.VITE_TWITCH_CLIENT_ID && !env.TWITCH_CLIENT_ID) {
    env.TWITCH_CLIENT_ID = env.VITE_TWITCH_CLIENT_ID;
    console.log(`Setting TWITCH_CLIENT_ID from VITE_TWITCH_CLIENT_ID: ${env.VITE_TWITCH_CLIENT_ID.substring(0, 5)}...`);
  }
  
  // Log available environment variables
  console.log("Environment Variables Available:");
  console.log(`- TWITCH_CLIENT_ID: ${env.TWITCH_CLIENT_ID ? "√" : "X"}`);
  console.log(`- VITE_TWITCH_CLIENT_ID: ${env.VITE_TWITCH_CLIENT_ID ? "√" : "X"}`);
  
  // Create env.js file that will be available to the client
  const envJsContent = `
    // This file is auto-generated during build
    window.ENV = window.ENV || {};
    window.ENV.TWITCH_CLIENT_ID = ${JSON.stringify(env.TWITCH_CLIENT_ID || '')};
    window.ENV.VITE_TWITCH_CLIENT_ID = ${JSON.stringify(env.VITE_TWITCH_CLIENT_ID || '')};
    window.TWITCH_CLIENT_ID = ${JSON.stringify(env.TWITCH_CLIENT_ID || env.VITE_TWITCH_CLIENT_ID || '')};
  `;
  
  // Ensure the public directory exists
  const publicDir = resolve(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Write the env.js file to the public directory
  fs.writeFileSync(resolve(publicDir, 'env.js'), envJsContent);
  console.log('Created env.js with environment variables');
  
  // Expose environment variables to client code
  const envWithProcessPrefix = {};
  const importMetaEnv = {};
  
  Object.entries(env).forEach(([key, val]) => {
    if (key.startsWith('VITE_') || key.startsWith('PUBLIC_') || key === 'TWITCH_CLIENT_ID') {
      envWithProcessPrefix[`process.env.${key}`] = JSON.stringify(val);
      importMetaEnv[key] = JSON.stringify(val);
    }
  });

  return {
    root: '.', // Explicitly set the root directory
    plugins: [
      react(),
      // Custom plugin to inject environment variables
      {
        name: 'inject-env-script',
        transformIndexHtml(html) {
          return html.replace(
            '</head>',
            `<script src="/env.js"></script></head>`
          );
        }
      }
    ],
    
    // Resolve path aliases
    resolve: {
      root: resolve(__dirname, './dist'),
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
      // Ensure environment variables are inlined
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    
    // Define global constants
    define: {
      ...envWithProcessPrefix,
      __ENV__: JSON.stringify(mode),
      'process.env.NODE_ENV': JSON.stringify(mode),
      // Directly define import.meta.env values
      ...Object.entries(importMetaEnv).reduce((acc, [key, value]) => {
        acc[`import.meta.env.${key}`] = value;
        return acc;
      }, {})
    }
  };
});
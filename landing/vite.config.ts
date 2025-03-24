// landing/vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// Generate env.js script with environment variables
function generateEnvJs(env) {
  const twitchClientId = env.TWITCH_CLIENT_ID || env.VITE_TWITCH_CLIENT_ID || '';
  
  return `
// This file is auto-generated during build
window.ENV = window.ENV || {};
window.ENV.TWITCH_CLIENT_ID = "${twitchClientId}";
window.ENV.VITE_TWITCH_CLIENT_ID = "${twitchClientId}";
window.TWITCH_CLIENT_ID = "${twitchClientId}";
console.log("[ENV] Loaded environment from env.js");
`;
}

export default defineConfig(({ mode }) => {
  console.log(`Building for mode: ${mode}`);
  
  // Load environment variables from .env files, process.env and command line
  // Prefix with empty string to load all env vars
  const env = {
    ...process.env,
    ...loadEnv(mode, process.cwd(), '')
  };
  
  // Display available environment variables for debugging
  console.log("Environment Variables Available:");
  console.log(`- TWITCH_CLIENT_ID: ${env.TWITCH_CLIENT_ID ? "✓" : "✗"}`);
  console.log(`- VITE_TWITCH_CLIENT_ID: ${env.VITE_TWITCH_CLIENT_ID ? "✓" : "✗"}`);
  
  // Ensure TWITCH_CLIENT_ID is properly set as VITE_TWITCH_CLIENT_ID and vice versa
  if (env.TWITCH_CLIENT_ID && !env.VITE_TWITCH_CLIENT_ID) {
    env.VITE_TWITCH_CLIENT_ID = env.TWITCH_CLIENT_ID;
    console.log(`Setting VITE_TWITCH_CLIENT_ID from TWITCH_CLIENT_ID: ${env.TWITCH_CLIENT_ID}`);
  } else if (env.VITE_TWITCH_CLIENT_ID && !env.TWITCH_CLIENT_ID) {
    env.TWITCH_CLIENT_ID = env.VITE_TWITCH_CLIENT_ID;
    console.log(`Setting TWITCH_CLIENT_ID from VITE_TWITCH_CLIENT_ID: ${env.VITE_TWITCH_CLIENT_ID}`);
  }
  
  // Ensure the public directory exists
  const publicDir = resolve(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Generate and write the env.js file
  const envJsContent = generateEnvJs(env);
  fs.writeFileSync(resolve(publicDir, 'env.js'), envJsContent);
  console.log('Created env.js with environment variables');
  
  // Define environment variables to be replaced at build time
  const envDefine = {};
  
  // Add process.env variables that should be available in client code
  const allowedVars = ['NODE_ENV', 'TWITCH_CLIENT_ID', 'VITE_TWITCH_CLIENT_ID'];
  allowedVars.forEach(key => {
    if (env[key]) {
      envDefine[`process.env.${key}`] = JSON.stringify(env[key]);
    }
  });
  
  // Add import.meta.env variables
  Object.keys(env).forEach(key => {
    if (key.startsWith('VITE_') || key === 'TWITCH_CLIENT_ID') {
      envDefine[`import.meta.env.${key}`] = JSON.stringify(env[key]);
    }
  });

  return {
    plugins: [
      react(),
      {
        name: 'twitch-env-injection',
        transformIndexHtml(html) {
          // Add inline script to ensure env vars are available immediately
          return html.replace(
            '</head>',
            `<script>
              window.ENV = window.ENV || {};
              window.ENV.TWITCH_CLIENT_ID = "${env.TWITCH_CLIENT_ID || env.VITE_TWITCH_CLIENT_ID || ''}";
              window.ENV.VITE_TWITCH_CLIENT_ID = "${env.VITE_TWITCH_CLIENT_ID || env.TWITCH_CLIENT_ID || ''}";
              window.TWITCH_CLIENT_ID = "${env.TWITCH_CLIENT_ID || env.VITE_TWITCH_CLIENT_ID || ''}";
              console.log("[ENV] Inline environment variables loaded");
            </script></head>`
          );
        }
      }
    ],
    
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
      host: '0.0.0.0', // Allow connections from outside the container
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
      // Ensure environment variables are inlined during build
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    
    // Define global constants (available in client code)
    define: {
      ...envDefine,
      __ENV__: JSON.stringify(mode),
    }
  };
});
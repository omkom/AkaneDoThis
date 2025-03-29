// landing/server/index.js
// Enhanced Express server with robust environment handling and caching

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import createEnvMiddleware from './middleware/env-middleware.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

// Create Express app
const app = express();

// Security and optimization middleware
app.use(helmet({
  contentSecurityPolicy: false, // Customize CSP as needed
}));
app.use(compression());
app.use(cors());
app.use(express.json());

// Define environment variables for the client
// Only expose approved variables
const clientEnv = {
  TWITCH_CLIENT_ID: process.env.VITE_TWITCH_CLIENT_ID || process.env.TWITCH_CLIENT_ID || '',
  PUBLIC_API_URL: process.env.PUBLIC_API_URL || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Server-only environment variables
const serverEnv = {
  clientId: clientEnv.TWITCH_CLIENT_ID,
  clientSecret: process.env.VITE_TWITCH_CLIENT_SECRET || process.env.TWITCH_CLIENT_SECRET || ''
};

// Validate critical environment variables in production
if (isProduction) {
  const missingVars = [];
  if (!serverEnv.clientId) missingVars.push('TWITCH_CLIENT_ID');
  if (!serverEnv.clientSecret) missingVars.push('TWITCH_CLIENT_SECRET');
  
  if (missingVars.length > 0) {
    throw new Error(`❌ Production build requires ${missingVars.join(', ')} to be set in the environment.`);
  }
}

// Log configuration on startup
console.log(`🚀 Server starting in ${process.env.NODE_ENV || 'development'} mode`);
console.log('🔑 Environment variables:');
console.log(`  • TWITCH_CLIENT_ID: ${serverEnv.clientId ? '✅ Set' : '❌ Missing'}`);
console.log(`  • TWITCH_CLIENT_SECRET: ${serverEnv.clientSecret ? '✅ Set' : '❌ Missing'}`);

// Token cache with expiry
const tokenCache = {
  token: null,
  expiry: 0,
  async getToken() {
    const now = Date.now();
    if (this.token && this.expiry > now) {
      return this.token;
    }
    
    try {
      const response = await axios.post(
        'https://id.twitch.tv/oauth2/token',
        null,
        {
          params: {
            client_id: serverEnv.clientId,
            client_secret: serverEnv.clientSecret,
            grant_type: 'client_credentials'
          }
        }
      );
      
      this.token = response.data.access_token;
      // Set expiry to 80% of actual expiry to be safe
      this.expiry = now + (response.data.expires_in * 800);
      return this.token;
    } catch (error) {
      console.error('Failed to get Twitch token:', error.message);
      return null;
    }
  }
};

// Middleware to inject environment variables as meta tags
app.use(createEnvMiddleware({ env: clientEnv }));

// Optional fallback env.js (client can fetch if meta tags fail)
app.get('/env.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(`window.ENV = ${JSON.stringify(clientEnv)}; window.TWITCH_CLIENT_ID = ${JSON.stringify(clientEnv.TWITCH_CLIENT_ID)};`);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    twitchClientId: serverEnv.clientId ? '✅ Set' : '❌ Missing'
  });
});

// API endpoint to get Twitch app token
app.post('/api/twitch/app-token', async (req, res) => {
  try {
    if (!serverEnv.clientId || !serverEnv.clientSecret) {
      return res.status(500).json({ error: 'Server missing Twitch credentials' });
    }
    
    const token = await tokenCache.getToken();
    if (!token) {
      return res.status(500).json({ error: 'Failed to obtain Twitch token' });
    }
    
    return res.json({
      access_token: token,
      // The client doesn't need to know the exact expiry
      expires_in: 3600
    });
  } catch (error) {
    console.error('Error in /api/twitch/app-token:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Proxy endpoint for Twitch API calls
app.get('/api/twitch/:endpoint', async (req, res) => {
  try {
    if (!serverEnv.clientId || !serverEnv.clientSecret) {
      return res.status(500).json({ error: 'Missing Twitch API credentials' });
    }
    
    const token = await tokenCache.getToken();
    if (!token) {
      return res.status(500).json({ error: 'Failed to obtain Twitch token' });
    }
    
    const { endpoint } = req.params;
    
    const twitchResponse = await axios.get(`https://api.twitch.tv/helix/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-ID': serverEnv.clientId
      },
      params: req.query
    });
    
    return res.json(twitchResponse.data);
  } catch (error) {
    console.error(`Error proxying to Twitch API:`, error.message);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Internal server error'
    });
  }
});

// Serve static files in production
if (isProduction) {
  const distPath = path.join(__dirname, '../dist');
  
  // Check if dist directory exists
  if (!fs.existsSync(distPath)) {
    console.error('❌ Error: dist directory not found!');
    console.error('   Run "npm run build" before starting the server in production mode.');
    process.exit(1);
  }
  
  // Set cache headers based on file types
  app.use((req, res, next) => {
    // For HTML files - no caching
    if (req.path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    // For JavaScript and CSS - cache for 1 week with versioning in filenames
    else if (req.path.match(/\.(js|css)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    }
    // For images, fonts, etc. - cache for 1 month
    else if (req.path.match(/\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    }
    next();
  });
  
  // Serve static files with appropriate caching
  app.use(express.static(distPath));
  
  // Twitch callback HTML file needs special handling
  app.get('/twitch-callback.html', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(distPath, 'twitch-callback.html'));
  });
  
  // All other routes should serve index.html for client-side routing
  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // In development, proxy to Vite dev server
  console.log('👨‍💻 Development mode: proxying to Vite dev server');
  
  app.use('/', async (req, res, next) => {
    // Skip API routes, they're handled directly by Express
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    try {
      const response = await axios({
        url: `http://localhost:5173${req.url}`,
        method: req.method,
        headers: {
          ...req.headers,
          host: 'localhost:5173',
        },
        data: req.body,
        responseType: 'stream',
        validateStatus: () => true, // Don't throw on error status
      });
      
      // Forward status code and headers
      res.status(response.status);
      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      // Stream the response
      response.data.pipe(res);
    } catch (error) {
      console.error('❌ Error proxying to Vite:', error.message);
      if (!res.headersSent) {
        res.status(500).send('Error connecting to Vite dev server. Is it running?');
      }
    }
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
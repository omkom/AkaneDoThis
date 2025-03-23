// landing/server/index.js
// Combined Express server for handling both API routes and serving the app

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import createEnvMiddleware from './middleware/env-middleware.js';

// Load environment variables
dotenv.config();

// Set up __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure environment variables to expose to the client
const clientEnv = {
  TWITCH_CLIENT_ID: process.env.VITE_TWITCH_CLIENT_ID || process.env.TWITCH_CLIENT_ID,
  PUBLIC_API_URL: process.env.PUBLIC_API_URL || '',
};

// Apply environment middleware
app.use(createEnvMiddleware({ env: clientEnv }));

// Parse JSON request bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    api: 'Twitch integration API'
  });
});

// Twitch API token endpoint
app.post('/api/twitch/app-token', async (req, res) => {
  try {
    // Get environment variables
    const clientId = process.env.VITE_TWITCH_CLIENT_ID || process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.VITE_TWITCH_CLIENT_SECRET || process.env.TWITCH_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('Missing Twitch API credentials');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Request a token from Twitch API
    const response = await axios.post(
      'https://id.twitch.tv/oauth2/token',
      null,
      {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials'
        }
      }
    );

    // Return token to client
    return res.status(200).json({
      access_token: response.data.access_token,
      expires_in: response.data.expires_in
    });
    
  } catch (error) {
    console.error('Error in app-token endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Proxy endpoint for Twitch API requests
app.get('/api/twitch/:endpoint', async (req, res) => {
  try {
    const { endpoint } = req.params;
    const clientId = process.env.VITE_TWITCH_CLIENT_ID || process.env.TWITCH_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({ error: 'Missing Twitch client ID' });
    }
    
    // Get token from Twitch
    const tokenResponse = await axios.post(
      'https://id.twitch.tv/oauth2/token',
      null,
      {
        params: {
          client_id: clientId,
          client_secret: process.env.TWITCH_CLIENT_SECRET,
          grant_type: 'client_credentials'
        }
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    
    // Forward the request to Twitch API
    const twitchResponse = await axios.get(`https://api.twitch.tv/helix/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-ID': clientId
      },
      params: req.query
    });
    
    return res.json(twitchResponse.data);
  } catch (error) {
    console.error(`Error proxying Twitch API request:`, error.message);
    return res.status(error.response?.status || 500).json({ 
      error: error.response?.data || 'Internal server error' 
    });
  }
});

// Dev environment: proxy to Vite
if (process.env.NODE_ENV === 'development') {
  console.log('Running in development mode, proxying to Vite dev server');
  
  // For development, proxy requests to Vite dev server
  app.use('/', async (req, res) => {
    try {
      const response = await axios({
        url: `http://localhost:5173${req.url}`,
        method: req.method,
        headers: req.headers,
        data: req.body,
        responseType: 'stream'
      });
      
      response.data.pipe(res);
    } catch (error) {
      console.error('Error proxying to Vite:', error.message);
      res.status(500).send('Error connecting to Vite dev server');
    }
  });
} else {
  // Production: serve static files
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // For all other routes, serve the index.html file
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Twitch Client ID: ${process.env.VITE_TWITCH_CLIENT_ID || process.env.TWITCH_CLIENT_ID ? '✅ Set' : '❌ Not set'}`);
  console.log(`Twitch Client Secret: ${process.env.VITE_TWITCH_CLIENT_SECRET || process.env.TWITCH_CLIENT_SECRET ? '✅ Set' : '❌ Not set'}`);
});
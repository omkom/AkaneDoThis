// landing/server/index.js
// Combined Express server for handling both API routes and serving the app

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import createEnvMiddleware from './middleware/env-middleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Centralized access to env vars
const clientEnv = {
  TWITCH_CLIENT_ID: process.env.VITE_TWITCH_CLIENT_ID || process.env.TWITCH_CLIENT_ID || '',
  PUBLIC_API_URL: process.env.PUBLIC_API_URL || ''
};

const serverEnv = {
  clientId: clientEnv.TWITCH_CLIENT_ID,
  clientSecret: process.env.VITE_TWITCH_CLIENT_SECRET || process.env.TWITCH_CLIENT_SECRET || ''
};

// ✅ Hard fail in prod if missing
if (process.env.NODE_ENV === 'production' && !serverEnv.clientId) {
  throw new Error('❌ Production build requires TWITCH_CLIENT_ID to be set in the environment.');
}

// ✅ Log loaded values
console.log('🟢 Public client env:', clientEnv);
console.log('🛠️ Server Twitch credentials:', {
  clientId: serverEnv.clientId ? '✅ Set' : '❌ Missing',
  clientSecret: serverEnv.clientSecret ? '✅ Set' : '❌ Missing'
});

// ✅ Middleware to inject meta tags
app.use(createEnvMiddleware({ env: clientEnv }));

app.use(express.json());

// ✅ Optional fallback env.js (client can use if no meta tag loaded in time)
app.get('/env.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`window.ENV = ${JSON.stringify(clientEnv)};`);
});

// ✅ Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    twitchClientId: serverEnv.clientId ? '✅ Set' : '❌ Missing'
  });
});

// ✅ Get Twitch App Token
app.post('/api/twitch/app-token', async (req, res) => {
  try {
    if (!serverEnv.clientId || !serverEnv.clientSecret) {
      console.error('Missing Twitch API credentials');
      return res.status(500).json({ error: 'Server configuration error' });
    }

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

    return res.status(200).json({
      access_token: response.data.access_token,
      expires_in: response.data.expires_in
    });

  } catch (error) {
    console.error('Error in app-token endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Proxy to Twitch API
app.get('/api/twitch/:endpoint', async (req, res) => {
  try {
    if (!serverEnv.clientId || !serverEnv.clientSecret) {
      return res.status(500).json({ error: 'Missing Twitch API credentials' });
    }

    const tokenResponse = await axios.post(
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

    const accessToken = tokenResponse.data.access_token;
    const { endpoint } = req.params;

    const twitchResponse = await axios.get(`https://api.twitch.tv/helix/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-ID': serverEnv.clientId
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

// ✅ Serve app (dev vs prod)
if (process.env.NODE_ENV === 'development') {
  console.log('Running in development mode, proxying to Vite dev server');

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
  app.use(express.static(path.join(__dirname, '../dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Twitch Client ID: ${process.env.VITE_TWITCH_CLIENT_ID || process.env.TWITCH_CLIENT_ID ? '✅ Set' : '❌ Not set'}`);
  console.log(`Twitch Client Secret: ${process.env.VITE_TWITCH_CLIENT_SECRET || process.env.TWITCH_CLIENT_SECRET ? '✅ Set' : '❌ Not set'}`);
});


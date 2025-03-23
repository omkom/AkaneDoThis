// landing/server/index.js
// Express server for handling Twitch API routes

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import twitchRoutes from './routes/twitch.js';
import healthRoutes from './routes/health.js';
import createEnvMiddleware from './middleware/env-middleware.js';
import cors from 'cors';

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
  TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID,
  PUBLIC_API_URL: process.env.PUBLIC_API_URL || '',
};

// Enable debugging
const DEBUG = process.env.DEBUG === 'true';
if (DEBUG) {
  console.log('Server starting with environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT,
    TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID ? '✓ Set' : '✗ Not set',
    TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET ? '✓ Set' : '✗ Not set',
  });
}

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:80'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Apply environment middleware
app.use(createEnvMiddleware({ env: clientEnv }));

// Parse JSON request bodies
app.use(express.json());

// Health check route
app.use('/api', healthRoutes);

// API routes
app.use('/api/twitch', twitchRoutes);

// Dynamic import for app-token.js to handle both file locations
const APP_TOKEN_PATH = path.resolve(__dirname, '../api/twitch/app-token.js');
if (DEBUG) {
  console.log('Checking for app-token.js at:', APP_TOKEN_PATH);
  console.log('File exists:', fs.existsSync(APP_TOKEN_PATH));
}

// Handle app-token API endpoint
app.post('/api/twitch/app-token', async (req, res) => {
  try {
    // Dynamically import the app-token.js module
    const appTokenModule = await import('../api/twitch/app-token.js');
    await appTokenModule.default(req, res);
  } catch (error) {
    console.error('Error handling app-token request:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Serve static files from the dist directory (for production)
app.use(express.static(path.join(__dirname, '../dist')));

// For all other routes, serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Twitch Client ID: ${process.env.TWITCH_CLIENT_ID ? '✅ Set' : '❌ Not set'}`);
  console.log(`Twitch Client Secret: ${process.env.TWITCH_CLIENT_SECRET ? '✅ Set' : '❌ Not set'}`);
});
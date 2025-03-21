// landing/server/index.js
// Express server for handling Twitch API routes

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import twitchRoutes from './routes/twitch.js';
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
  TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID,
  PUBLIC_API_URL: process.env.PUBLIC_API_URL || '',
};

// Apply environment middleware
app.use(createEnvMiddleware({ env: clientEnv }));

// Parse JSON request bodies
app.use(express.json());

// API routes
app.use('/api/twitch', twitchRoutes);

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
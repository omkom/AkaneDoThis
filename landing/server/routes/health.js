// server/routes/health.js
import express from 'express';
const router = express.Router();

/**
 * Simple health check endpoint
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    api: 'Twitch integration API',
    clientId: process.env.VITE_TWITCH_CLIENT_ID || process.env.TWITCH_CLIENT_ID ? '✓ Set' : '✗ Not set',
    clientSecret: process.env.VITE_TWITCH_CLIENT_SECRET || process.env.TWITCH_CLIENT_SECRET ? '✓ Set' : '✗ Not set',
  });
});

export default router;
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
    api: 'Twitch integration API'
  });
});

export default router;
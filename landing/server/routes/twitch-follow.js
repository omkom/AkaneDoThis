// landing/server/routes/twitch-follow.js
import express from 'express';
import twitchAPI from '../services/twitch-api.js';

const router = express.Router();

/**
 * Follow a channel
 * POST /api/twitch/follow
 * Body:
 *   - from_id: ID of the user who wants to follow
 *   - to_id: ID of the channel to follow
 * Headers:
 *   - Authorization: Bearer [user_token]
 */
router.post('/follow', async (req, res) => {
  try {
    const { from_id, to_id } = req.body;
    
    // Verify required parameters
    if (!from_id || !to_id) {
      return res.status(400).json({
        error: 'Missing required parameters: from_id and to_id'
      });
    }
    
    // Extract the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token d\'authentification requis'
      });
    }
    
    const userToken = authHeader.split(' ')[1];
    
    // Initialize the API if necessary
    if (!twitchAPI.token) {
      await twitchAPI.init();
    }
    
    // Call the follow channel method
    const result = await twitchAPI.followChannel(from_id, to_id, true, userToken);
    
    res.json({
      success: true,
      message: 'Channel followed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error following channel:', error);
    res.status(500).json({
      error: 'Failed to follow channel',
      message: error.message
    });
  }
});

/**
 * Unfollow a channel
 * DELETE /api/twitch/follow
 * Query params:
 *   - from_id: ID of the user who wants to unfollow
 *   - to_id: ID of the channel to unfollow
 * Headers:
 *   - Authorization: Bearer [user_token]
 */
router.delete('/follow', async (req, res) => {
  try {
    const { from_id, to_id } = req.query;
    
    // Verify required parameters
    if (!from_id || !to_id) {
      return res.status(400).json({
        error: 'Missing required parameters: from_id and to_id'
      });
    }
    
    // Extract the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token d\'authentification requis'
      });
    }
    
    const userToken = authHeader.split(' ')[1];
    
    // Initialize the API if necessary
    if (!twitchAPI.token) {
      await twitchAPI.init();
    }
    
    // Call the unfollow channel method
    const result = await twitchAPI.unfollowChannel(from_id, to_id, userToken);
    
    res.json({
      success: true,
      message: 'Channel unfollowed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error unfollowing channel:', error);
    res.status(500).json({
      error: 'Failed to unfollow channel',
      message: error.message
    });
  }
});

/**
 * Check if a user is following a channel
 * GET /api/twitch/follow
 * Query params:
 *   - from_id: ID of the user
 *   - to_id: ID of the channel
 */
router.get('/follow', async (req, res) => {
  try {
    const { from_id, to_id } = req.query;
    
    // Verify required parameters
    if (!from_id || !to_id) {
      return res.status(400).json({
        error: 'Missing required parameters: from_id and to_id'
      });
    }
    
    // Initialize the API if necessary
    if (!twitchAPI.token) {
      await twitchAPI.init();
    }
    
    // Check if the user is following the channel
    const isFollowing = await twitchAPI.checkFollowing(from_id, to_id);
    
    res.json({
      success: true,
      is_following: isFollowing
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({
      error: 'Failed to check follow status',
      message: error.message
    });
  }
});

export default router;

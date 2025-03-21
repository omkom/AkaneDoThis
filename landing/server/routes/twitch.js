import express from 'express';
import { getCombinedTwitchEvents } from '../services/twitch-schedule.js';
import twitchAPI from '../services/twitch-api.js';
import followRoutes from './twitch-follow.js';

const router = express.Router();

// Use the follow routes
router.use('/', followRoutes);

// Initialiser l'API Twitch au démarrage
try {
  await twitchAPI.init();
  console.log('API Twitch initialisée avec succès');
} catch (error) {
  console.error('Erreur lors de l\'initialisation de l\'API Twitch:', error);
}

/**
 * Route pour récupérer les événements Twitch (streams en direct + planning)
 * GET /api/twitch/events
 * Query params:
 *   - userId: ID de l'utilisateur Twitch
 * Headers:
 *   - Authorization: Bearer [user_token]
 */
router.get('/events', async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Vérifier les paramètres requis
    if (!userId) {
      return res.status(400).json({ 
        error: 'L\'ID utilisateur est requis' 
      });
    }
    
    // Extraire le token du header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token d\'authentification requis' 
      });
    }
    
    const userToken = authHeader.split(' ')[1];
    
    // Récupérer les événements combinés (streams en direct + planning)
    const events = await getCombinedTwitchEvents(userId, userToken);
    
    res.json(events);
  } catch (error) {
    console.error('Erreur lors de la récupération des événements Twitch:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des événements',
      message: error.message
    });
  }
});

/**
 * Route pour récupérer uniquement les streams en direct
 * GET /api/twitch/streams
 * Query params:
 *   - userId: ID de l'utilisateur Twitch
 */
router.get('/streams', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'L\'ID utilisateur est requis' 
      });
    }
    
    // Initialiser l'API si nécessaire
    if (!twitchAPI.token) {
      await twitchAPI.init();
    }
    
    // Récupérer les streams en direct
    const streams = await twitchAPI.getFollowedStreams(userId, { first: 20 });
    
    res.json(streams);
  } catch (error) {
    console.error('Erreur lors de la récupération des streams:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des streams',
      message: error.message
    });
  }
});

/**
 * Route pour récupérer uniquement le planning
 * GET /api/twitch/schedule
 * Query params:
 *   - userId: ID de l'utilisateur Twitch
 * Headers:
 *   - Authorization: Bearer [user_token]
 */
router.get('/schedule', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'L\'ID utilisateur est requis' 
      });
    }
    
    // Extraire le token du header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token d\'authentification requis' 
      });
    }
    
    const userToken = authHeader.split(' ')[1];
    
    // Initialiser l'API si nécessaire
    if (!twitchAPI.token) {
      await twitchAPI.init();
    }
    
    // Récupérer le planning des chaînes suivies
    const schedule = await getFollowedChannelsSchedule(userId, userToken);
    
    res.json(schedule);
  } catch (error) {
    console.error('Erreur lors de la récupération du planning:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du planning',
      message: error.message
    });
  }
});

export default router;
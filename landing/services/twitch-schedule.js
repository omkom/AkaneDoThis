// twitch-schedule.js
// Service pour récupérer le planning de streams Twitch

import twitchAPI from './twitch-api.js';

/**
 * Récupère le planning de diffusion d'une chaîne Twitch
 * @param {string} broadcasterId - ID du broadcaster
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Object>} - Données du planning
 */
export async function getChannelSchedule(broadcasterId, options = {}) {
  try {
    // Initialiser l'API Twitch si ce n'est pas déjà fait
    await twitchAPI.init();
    
    // Appel à l'API Twitch pour récupérer le planning
    const scheduleData = await twitchAPI.request('schedule', 'GET', {
      broadcaster_id: broadcasterId,
      ...options
    });
    
    return scheduleData;
  } catch (error) {
    console.error('Erreur lors de la récupération du planning:', error);
    throw error;
  }
}

/**
 * Récupère le planning de plusieurs chaînes
 * @param {Array<string>} broadcasterIds - Liste des IDs de broadcasters
 * @returns {Promise<Object>} - Données du planning par broadcaster
 */
export async function getMultipleChannelSchedules(broadcasterIds) {
  try {
    const schedules = {};
    
    // Récupérer le planning pour chaque broadcaster
    for (const id of broadcasterIds) {
      try {
        const schedule = await getChannelSchedule(id);
        schedules[id] = schedule;
      } catch (error) {
        console.warn(`Impossible de récupérer le planning pour l'ID ${id}:`, error.message);
        schedules[id] = { error: error.message };
      }
    }
    
    return schedules;
  } catch (error) {
    console.error('Erreur lors de la récupération des plannings multiples:', error);
    throw error;
  }
}

/**
 * Récupère le planning des chaînes suivies par un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} userToken - Token d'authentification utilisateur
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Array>} - Planning complet trié par date
 */
export async function getFollowedChannelsSchedule(userId, userToken, options = {}) {
  try {
    // Initialiser l'API Twitch
    await twitchAPI.init();
    
    // Récupérer les chaînes suivies par l'utilisateur
    const followedChannels = await twitchAPI.getFollowedChannels(userId, { first: 100 });
    
    if (!followedChannels.data || followedChannels.data.length === 0) {
      return { segments: [] };
    }
    
    // Extraire les IDs des chaînes suivies
    const broadcasterIds = followedChannels.data.map(follow => follow.to_id);
    
    // Récupérer le planning pour chaque chaîne suivie
    const schedules = await getMultipleChannelSchedules(broadcasterIds);
    
    // Fusionner et trier les segments de planning
    const allSegments = [];
    
    Object.entries(schedules).forEach(([broadcasterId, scheduleData]) => {
      if (scheduleData.data && scheduleData.data.segments) {
        const broadcasterInfo = followedChannels.data.find(follow => follow.to_id === broadcasterId);
        const broadcasterName = broadcasterInfo ? broadcasterInfo.to_name : 'Unknown';
        
        scheduleData.data.segments.forEach(segment => {
          allSegments.push({
            ...segment,
            broadcaster_id: broadcasterId,
            broadcaster_name: broadcasterName,
            profile_image_url: scheduleData.data.broadcaster?.profile_image_url
          });
        });
      }
    });
    
    // Trier les segments par date de début
    allSegments.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    
    return { segments: allSegments };
  } catch (error) {
    console.error('Erreur lors de la récupération du planning des chaînes suivies:', error);
    throw error;
  }
}

/**
 * Récupère les streams en direct des chaînes suivies par un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Array>} - Liste des streams en direct
 */
export async function getLiveFollowedStreams(userId, options = {}) {
  try {
    // Initialiser l'API Twitch
    await twitchAPI.init();
    
    // Récupérer les streams en direct des chaînes suivies
    const liveStreams = await twitchAPI.getFollowedStreams(userId, { 
      first: options.first || 20 
    });
    
    return liveStreams;
  } catch (error) {
    console.error('Erreur lors de la récupération des streams en direct:', error);
    throw error;
  }
}

/**
 * Combine les plannings et les streams en direct dans un unique flux d'événements
 * @param {string} userId - ID de l'utilisateur
 * @param {string} userToken - Token d'authentification utilisateur
 * @returns {Promise<Array>} - Flux d'événements trié par date
 */
export async function getCombinedTwitchEvents(userId, userToken) {
  try {
    // Récupérer parallèlement les streams en direct et les plannings
    const [liveStreamsResult, schedulesResult] = await Promise.all([
      getLiveFollowedStreams(userId),
      getFollowedChannelsSchedule(userId, userToken)
    ]);
    
    const events = [];
    
    // Ajouter les streams en direct
    if (liveStreamsResult.data) {
      liveStreamsResult.data.forEach(stream => {
        events.push({
          type: 'live',
          id: stream.id,
          broadcaster_id: stream.user_id,
          broadcaster_name: stream.user_name,
          title: stream.title,
          game_name: stream.game_name,
          thumbnail_url: stream.thumbnail_url,
          viewer_count: stream.viewer_count,
          started_at: stream.started_at,
          language: stream.language,
          tags: stream.tags,
          is_mature: stream.is_mature
        });
      });
    }
    
    // Ajouter les segments de planning futurs
    if (schedulesResult.segments) {
      const now = new Date();
      
      schedulesResult.segments.forEach(segment => {
        const startTime = new Date(segment.start_time);
        
        // N'inclure que les événements futurs
        if (startTime > now) {
          events.push({
            type: 'scheduled',
            id: segment.id,
            broadcaster_id: segment.broadcaster_id,
            broadcaster_name: segment.broadcaster_name,
            title: segment.title,
            category: segment.category ? segment.category.name : null,
            start_time: segment.start_time,
            end_time: segment.end_time,
            profile_image_url: segment.profile_image_url
          });
        }
      });
    }
    
    // Trier par date (streams en direct d'abord, puis événements planifiés)
    events.sort((a, b) => {
      // Les streams en direct sont toujours en premier
      if (a.type === 'live' && b.type !== 'live') return -1;
      if (a.type !== 'live' && b.type === 'live') return 1;
      
      // Ensuite, trier par date
      const dateA = a.type === 'live' ? new Date(a.started_at) : new Date(a.start_time);
      const dateB = b.type === 'live' ? new Date(b.started_at) : new Date(b.start_time);
      
      return dateA - dateB;
    });
    
    return events;
  } catch (error) {
    console.error('Erreur lors de la récupération des événements Twitch combinés:', error);
    throw error;
  }
}
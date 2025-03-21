// twitch-api.js
// A service for interacting with the Twitch API (ES Module version with debugging)

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable debug mode
const DEBUG = true;

class TwitchAPIService {
  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID;
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET;
    this.tokenCachePath = path.join(__dirname, '.twitch-token-cache.json');
    this.token = null;
    this.tokenExpiry = null;
    
    if (DEBUG) {
      console.log('TwitchAPIService initialized with:');
      console.log('- Client ID length:', this.clientId ? this.clientId.length : 0);
      console.log('- Client Secret length:', this.clientSecret ? this.clientSecret.length : 0);
      console.log('- Token cache path:', this.tokenCachePath);
    }
  }

  /**
   * Initialize the Twitch API service
   */
  async init() {
    try {
      if (DEBUG) console.log('Initializing Twitch API service...');
      
      if (!this.clientId || !this.clientSecret) {
        console.error('ERROR: Client ID or Client Secret is missing!');
        console.error('Make sure your .env file is correctly set up with:');
        console.error('TWITCH_CLIENT_ID=your_client_id');
        console.error('TWITCH_CLIENT_SECRET=your_client_secret');
        return false;
      }
      
      await this.loadTokenFromCache();
      // If token is expired or not found, get a new one
      if (!this.token || this.isTokenExpired()) {
        if (DEBUG) console.log('Token missing or expired, getting new token...');
        await this.getToken();
      } else if (DEBUG) {
        console.log('Using cached token, expires:', this.tokenExpiry);
      }
      return true;
    } catch (error) {
      console.error('Failed to initialize Twitch API service:', error.message);
      return false;
    }
  }

  /**
   * Load token from cache file if it exists
   */
  async loadTokenFromCache() {
    try {
      if (fs.existsSync(this.tokenCachePath)) {
        if (DEBUG) console.log('Loading token from cache file...');
        const cache = JSON.parse(fs.readFileSync(this.tokenCachePath, 'utf8'));
        this.token = cache.token;
        this.tokenExpiry = new Date(cache.expiry);
        if (DEBUG) console.log('Token loaded from cache, expires:', this.tokenExpiry);
      } else if (DEBUG) {
        console.log('No token cache file found.');
      }
    } catch (error) {
      console.warn('Could not load token from cache:', error.message);
    }
  }

  /**
   * Save token to cache file
   */
  async saveTokenToCache() {
    try {
      if (DEBUG) console.log('Saving token to cache file...');
      const cache = {
        token: this.token,
        expiry: this.tokenExpiry.toISOString(),
      };
      fs.writeFileSync(this.tokenCachePath, JSON.stringify(cache, null, 2));
      if (DEBUG) console.log('Token saved to cache successfully.');
    } catch (error) {
      console.warn('Could not save token to cache:', error.message);
    }
  }

  /**
   * Check if the current token is expired
   */
  isTokenExpired() {
    if (!this.tokenExpiry) return true;
    // Consider token expired 5 minutes before actual expiry
    const bufferTime = 5 * 60 * 1000;
    const isExpired = new Date() > new Date(this.tokenExpiry.getTime() - bufferTime);
    if (DEBUG) console.log('Token expired?', isExpired);
    return isExpired;
  }

  /**
   * Get a new OAuth token using client credentials flow
   */
  async getToken() {
    try {
      if (DEBUG) console.log('Getting new Twitch API token...');
      
      if (!this.clientId || !this.clientSecret) {
        throw new Error('TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET environment variables must be set');
      }

      if (DEBUG) {
        console.log('POST https://id.twitch.tv/oauth2/token');
        console.log('Params:', {
          client_id: this.clientId.substring(0, 5) + '...',
          client_secret: '****',
          grant_type: 'client_credentials'
        });
      }

      const response = await axios.post(
        'https://id.twitch.tv/oauth2/token',
        null,
        {
          params: {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'client_credentials'
          }
        }
      );

      if (DEBUG) console.log('Token response status:', response.status);
      
      this.token = response.data.access_token;
      
      // Calculate token expiry time
      const expiresInMs = response.data.expires_in * 1000;
      this.tokenExpiry = new Date(Date.now() + expiresInMs);
      
      if (DEBUG) {
        console.log('Token obtained successfully');
        console.log('- Access token length:', this.token.length);
        console.log('- Expires in:', response.data.expires_in, 'seconds');
        console.log('- Expiry date:', this.tokenExpiry);
      }
      
      // Save to cache
      await this.saveTokenToCache();
      
      return this.token;
    } catch (error) {
      console.error('Failed to get Twitch token:');
      if (error.response) {
        console.error('- Status:', error.response.status);
        console.error('- Response data:', error.response.data);
      } else {
        console.error('- Error:', error.message);
      }
      throw error;
    }
  }

  /**
   * Make an authenticated request to the Twitch API
   */
  async request(endpoint, method = 'GET', params = {}, data = null) {
    try {
      // Ensure we have a valid token
      if (!this.token || this.isTokenExpired()) {
        if (DEBUG) console.log('Getting new token before request...');
        await this.getToken();
      }

      const url = `https://api.twitch.tv/helix/${endpoint}`;
      
      if (DEBUG) {
        console.log(`${method} ${url}`);
        console.log('Headers:', {
          'Client-ID': this.clientId.substring(0, 5) + '...',
          'Authorization': `Bearer ${this.token.substring(0, 5)}...`
        });
        if (Object.keys(params).length > 0) {
          console.log('Params:', params);
        }
        if (data) {
          console.log('Data:', data);
        }
      }
      
      const response = await axios({
        method,
        url,
        params,
        data,
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (DEBUG) {
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
      }

      return response.data;
    } catch (error) {
      // If we get a 401, token might be invalid, try to get a new one
      if (error.response && error.response.status === 401) {
        console.log('Token invalid, getting new token');
        await this.getToken();
        // Retry the request once
        return this.request(endpoint, method, params, data);
      }
      
      console.error('Twitch API request failed:');
      if (error.response) {
        console.error('- Status:', error.response.status);
        console.error('- Response headers:', error.response.headers);
        console.error('- Response data:', error.response.data);
      } else if (error.request) {
        console.error('- Request was made but no response received');
        console.error(error.request);
      } else {
        console.error('- Error:', error.message);
      }
      console.error('- Request details:', {
        method,
        url: `https://api.twitch.tv/helix/${endpoint}`,
        params
      });
      
      throw error;
    }
  }

  /**
   * Test connection to Twitch API
   */
  async testConnection() {
    try {
      if (DEBUG) console.log('Testing Twitch API connection...');
      
      // First test token endpoint
      const tokenResponse = await axios.post(
        'https://id.twitch.tv/oauth2/token',
        null,
        {
          params: {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'client_credentials'
          }
        }
      );
      
      console.log('✅ Successfully connected to token endpoint');
      console.log('- Status:', tokenResponse.status);
      
      // Test API endpoint
      const testToken = tokenResponse.data.access_token;
      const apiResponse = await axios.get(
        'https://api.twitch.tv/helix/games/top',
        {
          headers: {
            'Client-ID': this.clientId,
            'Authorization': `Bearer ${testToken}`
          },
          params: {
            first: 1
          }
        }
      );
      
      console.log('✅ Successfully connected to API endpoint');
      console.log('- Status:', apiResponse.status);
      console.log('- Data received:', !!apiResponse.data);
      
      return true;
    } catch (error) {
      console.error('❌ API connection test failed:');
      if (error.response) {
        console.error('- Status:', error.response.status);
        console.error('- Response data:', error.response.data);
      } else if (error.request) {
        console.error('- No response received');
      } else {
        console.error('- Error:', error.message);
      }
      return false;
    }
  }

  // Rest of the methods remain the same...
  async getUserByName(username) {
    return this.request('users', 'GET', { login: username });
  }

  async getUserById(userId) {
    return this.request('users', 'GET', { id: userId });
  }

  async getStreams(options = {}) {
    return this.request('streams', 'GET', options);
  }

  async getChannelInfo(broadcasterId) {
    return this.request('channels', 'GET', { broadcaster_id: broadcasterId });
  }

  async getTopGames(options = {}) {
    return this.request('games/top', 'GET', options);
  }

  async searchCategories(query, options = {}) {
    return this.request('search/categories', 'GET', { query, ...options });
  }

  async searchChannels(query, options = {}) {
    return this.request('search/channels', 'GET', { query, ...options });
  }

  async getVideos(options = {}) {
    return this.request('videos', 'GET', options);
  }

  async getClips(options = {}) {
    return this.request('clips', 'GET', options);
  }

  async getFollowedStreams(userId, options = {}) {
    return this.request('streams/followed', 'GET', { user_id: userId, ...options });
  }

  /**
   * Permet à un utilisateur de suivre une chaîne Twitch
   * Nécessite un token OAuth d'utilisateur avec le scope 'user:edit:follows'
   * 
   * @param {string} fromId - ID de l'utilisateur qui suit
   * @param {string} toId - ID de la chaîne à suivre
   * @param {boolean} [notifications=false] - Activer les notifications
   * @param {string} userToken - Token OAuth de l'utilisateur (pas le token client credentials)
   * @returns {Promise<Object>} - Réponse de l'API
   */
  async followChannel(fromId, toId, notifications = false, userToken) {
    if (!userToken) {
      throw new Error('Un token OAuth utilisateur avec le scope "user:edit:follows" est requis');
    }

    // Utilisez le token utilisateur fourni au lieu du token d'application
    try {
      const url = `https://api.twitch.tv/helix/users/follows`;
      
      if (DEBUG) {
        console.log(`POST ${url}`);
        console.log('Headers:', {
          'Client-ID': this.clientId.substring(0, 5) + '...',
          'Authorization': `Bearer ${userToken.substring(0, 5)}...`
        });
        console.log('Data:', {
          from_id: fromId,
          to_id: toId,
          notifications
        });
      }
      
      const response = await axios({
        method: 'POST',
        url,
        data: {
          from_id: fromId,
          to_id: toId,
          notifications
        },
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors du suivi de la chaîne:');
      if (error.response) {
        console.error('- Status:', error.response.status);
        console.error('- Message:', error.response.data);
        
        if (error.response.status === 401) {
          console.error('- Le token utilisateur est invalide ou n\'a pas les bons scopes');
        }
      } else {
        console.error('- Erreur:', error.message);
      }
      throw error;
    }
  }

  /**
   * Permet à un utilisateur d'arrêter de suivre une chaîne Twitch
   * Nécessite un token OAuth d'utilisateur avec le scope 'user:edit:follows'
   * 
   * @param {string} fromId - ID de l'utilisateur qui suit
   * @param {string} toId - ID de la chaîne à ne plus suivre
   * @param {string} userToken - Token OAuth de l'utilisateur (pas le token client credentials)
   * @returns {Promise<Object>} - Réponse de l'API
   */
  async unfollowChannel(fromId, toId, userToken) {
    if (!userToken) {
      throw new Error('Un token OAuth utilisateur avec le scope "user:edit:follows" est requis');
    }

    try {
      const url = `https://api.twitch.tv/helix/users/follows`;
      
      if (DEBUG) {
        console.log(`DELETE ${url}`);
        console.log('Headers:', {
          'Client-ID': this.clientId.substring(0, 5) + '...',
          'Authorization': `Bearer ${userToken.substring(0, 5)}...`
        });
        console.log('Params:', {
          from_id: fromId,
          to_id: toId
        });
      }
      
      const response = await axios({
        method: 'DELETE',
        url,
        params: {
          from_id: fromId,
          to_id: toId
        },
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'arrêt du suivi de la chaîne:');
      if (error.response) {
        console.error('- Status:', error.response.status);
        console.error('- Message:', error.response.data);
      } else {
        console.error('- Erreur:', error.message);
      }
      throw error;
    }
  }

  /**
   * Vérifie si un utilisateur suit une chaîne spécifique
   * 
   * @param {string} fromId - ID de l'utilisateur qui suit potentiellement
   * @param {string} toId - ID de la chaîne potentiellement suivie
   * @returns {Promise<boolean>} - true si l'utilisateur suit la chaîne, false sinon
   */
  async checkFollowing(fromId, toId) {
    try {
      const response = await this.request('users/follows', 'GET', {
        from_id: fromId,
        to_id: toId
      });
      
      // Si la réponse contient au moins une entrée, l'utilisateur suit la chaîne
      return response.data.length > 0;
    } catch (error) {
      console.error('Erreur lors de la vérification du suivi:');
      if (error.response) {
        console.error('- Status:', error.response.status);
        console.error('- Message:', error.response.data);
      } else {
        console.error('- Erreur:', error.message);
      }
      throw error;
    }
  }

  /**
   * Obtient la liste des chaînes suivies par un utilisateur
   * 
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options supplémentaires
   * @param {number} [options.first] - Nombre de résultats à retourner
   * @param {string} [options.after] - Curseur pour la pagination
   * @returns {Promise<Object>} - Réponse de l'API avec la liste des chaînes suivies
   */
  async getFollowedChannels(userId, options = {}) {
    try {
      return await this.request('users/follows', 'GET', { 
        from_id: userId,
        ...options
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des chaînes suivies:');
      if (error.response) {
        console.error('- Status:', error.response.status);
        console.error('- Message:', error.response.data);
      } else {
        console.error('- Erreur:', error.message);
      }
      throw error;
    }
  }
}


// Create a singleton instance
const twitchAPI = new TwitchAPIService();

// Export the singleton
export default twitchAPI;
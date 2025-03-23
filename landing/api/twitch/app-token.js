// landing/api/twitch/app-token.js
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get environment variables
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    
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
}
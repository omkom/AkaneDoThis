/**
 * API endpoint for retrieving a Twitch application token
 * Used to access public Twitch API endpoints
 */
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
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials'
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Twitch API error:', errorData);
        return res.status(response.status).json({ 
          error: 'Error fetching Twitch token',
          details: errorData
        });
      }
  
      const data = await response.json();
      
      // Return token to client
      return res.status(200).json({
        access_token: data.access_token,
        expires_in: data.expires_in
      });
      
    } catch (error) {
      console.error('Error in app-token endpoint:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
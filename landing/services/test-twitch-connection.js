// test-twitch-connection.js
// A script to diagnose Twitch API connection issues

import 'dotenv/config';
import axios from 'axios';

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;

console.log('=== Twitch API Connection Diagnostic ===');

// First, check for environment variables
console.log('\n1. Checking environment variables:');
if (!clientId) {
  console.error('❌ TWITCH_CLIENT_ID is missing from environment variables');
  console.log('Make sure your .env file contains TWITCH_CLIENT_ID=your_client_id');
  process.exit(1);
} else {
  console.log('✅ TWITCH_CLIENT_ID is set (length: ' + clientId.length + ')');
}

if (!clientSecret) {
  console.error('❌ TWITCH_CLIENT_SECRET is missing from environment variables');
  console.log('Make sure your .env file contains TWITCH_CLIENT_SECRET=your_client_secret');
  process.exit(1);
} else {
  console.log('✅ TWITCH_CLIENT_SECRET is set (length: ' + clientSecret.length + ')');
}

// Now test the token endpoint
console.log('\n2. Testing connection to token endpoint:');
try {
  const tokenResponse = await axios.post(
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
  
  console.log('✅ Successfully connected to token endpoint');
  console.log('  - Status: ' + tokenResponse.status);
  console.log('  - Token type: ' + tokenResponse.data.token_type);
  console.log('  - Expires in: ' + tokenResponse.data.expires_in + ' seconds');
  
  // Now test the API endpoint
  console.log('\n3. Testing connection to API endpoint:');
  const testToken = tokenResponse.data.access_token;
  
  try {
    const apiResponse = await axios.get(
      'https://api.twitch.tv/helix/games/top',
      {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${testToken}`
        },
        params: {
          first: 1
        }
      }
    );
    
    console.log('✅ Successfully connected to API endpoint');
    console.log('  - Status: ' + apiResponse.status);
    console.log('  - Game name: ' + apiResponse.data.data[0].name);
    
    console.log('\n✅ ALL TESTS PASSED! Your Twitch API credentials are working correctly.');
    
  } catch (apiError) {
    console.error('❌ API endpoint test failed:');
    if (apiError.response) {
      console.error('  - Status: ' + apiError.response.status);
      console.error('  - Error data: ', apiError.response.data);
    } else if (apiError.request) {
      console.error('  - No response received from API');
      console.error('  - This might be a network issue or firewall problem');
    } else {
      console.error('  - Error: ' + apiError.message);
    }
    
    console.log('\n🔍 Troubleshooting tips:');
    console.log('1. Check if your IP is allowed to access Twitch API');
    console.log('2. Ensure your Client ID is registered correctly in Twitch Developer Console');
    console.log('3. Try accessing the API from a different network');
  }
  
} catch (tokenError) {
  console.error('❌ Token endpoint test failed:');
  if (tokenError.response) {
    console.error('  - Status: ' + tokenError.response.status);
    console.error('  - Error data: ', tokenError.response.data);
  } else if (tokenError.request) {
    console.error('  - No response received');
    console.error('  - This might be a network issue or firewall problem');
  } else {
    console.error('  - Error: ' + tokenError.message);
  }
  
  console.log('\n🔍 Troubleshooting tips:');
  console.log('1. Double-check your client ID and client secret');
  console.log('2. Verify your Twitch developer application is correctly set up');
  console.log('3. Make sure you are not using a revoked or invalid client secret');
}
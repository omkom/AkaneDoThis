// twitch-auth.js
// Module pour gérer l'authentification des utilisateurs avec Twitch

import axios from 'axios';
import express from 'express';
import open from 'open';
import 'dotenv/config';

const app = express();
const PORT = 4173;
let authServer = null;

/**
 * Démarre le processus d'authentification OAuth pour obtenir un token utilisateur
 * 
 * @param {Array<string>} scopes - Liste des scopes nécessaires (par ex. 'user:edit:follows')
 * @returns {Promise<string>} - Token d'authentification utilisateur
 */
export async function getUserToken(scopes = ['user:edit:follows']) {
  return new Promise((resolve, reject) => {
    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) {
      reject(new Error('TWITCH_CLIENT_ID non défini dans les variables d\'environnement'));
      return;
    }

    const redirectUri = `http://localhost:${PORT}/callback`;
    const scopesString = scopes.join(' ');
    
    // Créer un état aléatoire pour la sécurité
    const state = Math.random().toString(36).substring(2, 15);
    
    // URL d'authentification Twitch
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scopesString)}&state=${state}`;
    
    // Configurer le serveur Express pour recevoir le callback
    app.get('/callback', (req, res) => {
      // Cette page reçoit l'URL hash qui contient le token
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentification Twitch</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .success { color: green; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <h2>Authentification Twitch</h2>
          <div id="status">Traitement de l'authentification...</div>
          <script>
            // Extraire le token d'accès de l'URL hash
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const state = params.get('state');
            const receivedState = '${state}';
            
            if (accessToken && state === receivedState) {
              document.getElementById('status').className = 'success';
              document.getElementById('status').textContent = 'Authentification réussie! Vous pouvez fermer cette page.';
              // Envoyer le token au serveur
              fetch('/token?access_token=' + accessToken)
                .then(response => {
                  window.close();
                })
                .catch(error => {
                  document.getElementById('status').className = 'error';
                  document.getElementById('status').textContent = 'Erreur lors de l\'envoi du token au serveur.';
                });
            } else {
              document.getElementById('status').className = 'error';
              document.getElementById('status').textContent = 'Erreur d\'authentification. Token non reçu ou état invalide.';
            }
          </script>
        </body>
        </html>
      `);
    });
    
    // Endpoint pour recevoir le token d'accès
    app.get('/token', (req, res) => {
      const accessToken = req.query.access_token;
      if (accessToken) {
        res.send('Token reçu');
        resolve(accessToken);
        
        // Fermer le serveur après réception du token
        setTimeout(() => {
          if (authServer) {
            authServer.close();
            authServer = null;
            console.log('Serveur d\'authentification fermé');
          }
        }, 1000);
      } else {
        res.status(400).send('Token non fourni');
        reject(new Error('Token non fourni'));
      }
    });
    
    // Démarrer le serveur
    authServer = app.listen(PORT, () => {
      console.log(`Serveur d'authentification démarré sur le port ${PORT}`);
      
      // Ouvrir le navigateur pour l'authentification
      console.log(`Ouverture du navigateur pour l'authentification Twitch...`);
      open(authUrl);
    });
  });
}

/**
 * Vérifie si un token utilisateur est valide et obtient ses informations
 * 
 * @param {string} token - Token d'authentification utilisateur à valider
 * @returns {Promise<Object>} - Informations sur le token
 */
export async function validateUserToken(token) {
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://id.twitch.tv/oauth2/validate',
      headers: {
        'Authorization': `OAuth ${token}`
      }
    });
    
    return {
      valid: true,
      clientId: response.data.client_id,
      userId: response.data.user_id,
      login: response.data.login,
      scopes: response.data.scopes,
      expiresIn: response.data.expires_in
    };
  } catch (error) {
    console.error('Erreur lors de la validation du token utilisateur:');
    if (error.response) {
      console.error('- Status:', error.response.status);
      console.error('- Message:', error.response.data);
    } else {
      console.error('- Erreur:', error.message);
    }
    
    return {
      valid: false,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Révoque un token utilisateur
 * 
 * @param {string} token - Token d'authentification utilisateur à révoquer
 * @returns {Promise<boolean>} - true si la révocation a réussi, false sinon
 */
export async function revokeUserToken(token) {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    
    const response = await axios({
      method: 'POST',
      url: 'https://id.twitch.tv/oauth2/revoke',
      params: {
        client_id: clientId,
        token: token
      }
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Erreur lors de la révocation du token:');
    if (error.response) {
      console.error('- Status:', error.response.status);
      console.error('- Message:', error.response.data);
    } else {
      console.error('- Erreur:', error.message);
    }
    return false;
  }
}
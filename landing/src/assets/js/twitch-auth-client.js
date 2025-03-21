// twitch-auth-client.js
// Script pour gérer l'authentification Twitch côté client

(function() {
    // Configuration
    const TWITCH_CLIENT_ID = window.TWITCH_CLIENT_ID || ''; // Injecté à partir de vos variables d'environnement
    const REDIRECT_URI = window.location.origin + '/twitch-callback.html';
    
    // Vérifier si les informations nécessaires sont disponibles
    if (!TWITCH_CLIENT_ID) {
      console.error('TWITCH_CLIENT_ID n\'est pas défini');
    }
    
    /**
     * Ouvre une fenêtre popup pour l'authentification Twitch
     * @param {Array<string>} scopes - Les permissions demandées
     * @returns {Promise<Object>} - Token et données utilisateur
     */
    window.loginWithTwitch = function(scopes = ['user:read:follows']) {
      return new Promise((resolve, reject) => {
        // Générer un état aléatoire pour la sécurité
        const state = Math.random().toString(36).substring(2, 15);
        
        // Construire l'URL d'authentification
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${encodeURIComponent(scopes.join(' '))}&state=${state}`;
        
        // Ouvrir la fenêtre popup
        const popup = window.open(
          authUrl, 
          'TwitchAuth', 
          'width=600,height=800,resizable=yes,scrollbars=yes,status=yes'
        );
        
        // Gérer le cas où la fenêtre popup est bloquée
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          reject(new Error('La fenêtre popup a été bloquée. Veuillez autoriser les popups pour ce site.'));
          return;
        }
        
        // Fonction pour gérer la réception des données depuis la fenêtre popup
        const receiveMessage = async function(event) {
          // Vérifier l'origine pour la sécurité
          if (event.origin !== window.location.origin) {
            return;
          }
          
          // Vérifier si les données contiennent un token
          if (event.data.type === 'TWITCH_AUTH' && event.data.token) {
            // Nettoyer les écouteurs d'événements
            window.removeEventListener('message', receiveMessage);
            
            // Vérifier l'état pour la sécurité
            if (event.data.state !== state) {
              reject(new Error('État invalide, possible tentative de CSRF'));
              return;
            }
            
            try {
              // Récupérer les informations de l'utilisateur
              const userData = await getUserInfo(event.data.token);
              
              // Résoudre la promesse avec le token et les données utilisateur
              resolve({
                token: event.data.token,
                userData: userData
              });
            } catch (error) {
              reject(error);
            }
          }
        };
        
        // Écouter les messages de la fenêtre popup
        window.addEventListener('message', receiveMessage);
        
        // Vérifier périodiquement si la fenêtre a été fermée sans terminer l'auth
        const popupCheckInterval = setInterval(() => {
          if (popup.closed) {
            clearInterval(popupCheckInterval);
            window.removeEventListener('message', receiveMessage);
            reject(new Error('Authentification annulée'));
          }
        }, 1000);
      });
    };
    
    /**
     * Récupère les informations de l'utilisateur connecté
     * @param {string} token - Token d'accès Twitch
     * @returns {Promise<Object>} - Informations utilisateur
     */
    async function getUserInfo(token) {
      try {
        const response = await fetch('https://api.twitch.tv/helix/users', {
          headers: {
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des informations utilisateur');
        }
        
        const data = await response.json();
        return data.data[0]; // Twitch renvoie un tableau, mais nous n'avons besoin que du premier élément
      } catch (error) {
        console.error('Erreur lors de la récupération des informations utilisateur:', error);
        throw error;
      }
    }
    
    /**
     * Vérifie si un token est valide
     * @param {string} token - Token à valider
     * @returns {Promise<boolean>} - true si le token est valide
     */
    window.validateTwitchToken = async function(token) {
      try {
        const response = await fetch('https://id.twitch.tv/oauth2/validate', {
          headers: {
            'Authorization': `OAuth ${token}`
          }
        });
        
        return response.ok;
      } catch (error) {
        console.error('Erreur lors de la validation du token:', error);
        return false;
      }
    };
    
    /**
     * Déconnecte l'utilisateur en révoquant le token
     * @param {string} token - Token à révoquer
     * @returns {Promise<boolean>} - true si la déconnexion a réussi
     */
    window.logoutFromTwitch = async function(token) {
      try {
        const response = await fetch(`https://id.twitch.tv/oauth2/revoke?client_id=${TWITCH_CLIENT_ID}&token=${token}`, {
          method: 'POST'
        });
        
        return response.ok;
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        return false;
      }
    };
  })();
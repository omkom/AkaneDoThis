// follow-example.js
// Exemple d'utilisation des fonctionnalités de suivi de chaîne Twitch

import 'dotenv/config';
import twitchAPI from './twitch-api.js';
import { getUserToken, validateUserToken } from './twitch-auth.js';

async function followExample() {
  try {
    console.log('=== Exemple de Suivi de Chaîne Twitch ===');
    
    // 0. Initialiser l'API Twitch
    console.log('\n1. Initialisation de l\'API Twitch...');
    await twitchAPI.init();
    console.log('✅ API Twitch initialisée');
    
    // 1. Obtenir un token utilisateur avec les scopes nécessaires
    console.log('\n2. Obtention d\'un token utilisateur...');
    console.log('Une fenêtre de navigateur va s\'ouvrir pour l\'authentification Twitch.');
    console.log('Veuillez vous connecter et autoriser l\'application.');
    
    const userToken = await getUserToken(['user:edit:follows']);
    console.log('✅ Token utilisateur obtenu');
    
    // 2. Valider le token et obtenir l'ID de l'utilisateur
    console.log('\n3. Validation du token utilisateur...');
    const tokenInfo = await validateUserToken(userToken);
    
    if (!tokenInfo.valid) {
      throw new Error('Le token utilisateur n\'est pas valide');
    }
    
    console.log('✅ Token valide pour l\'utilisateur:', tokenInfo.login);
    console.log('   ID utilisateur:', tokenInfo.userId);
    console.log('   Scopes:', tokenInfo.scopes.join(', '));
    
    // 3. Rechercher une chaîne à suivre
    console.log('\n4. Recherche d\'une chaîne...');
    const channelName = 'akanedothis'; // Utilisez le compte de test officiel de Twitch
    const searchResults = await twitchAPI.searchChannels(channelName, { first: 1 });
    
    if (!searchResults.data || searchResults.data.length === 0) {
      throw new Error(`Aucune chaîne trouvée avec le nom "${channelName}"`);
    }
    
    const channel = searchResults.data[0];
    console.log('✅ Chaîne trouvée:', channel.display_name);
    console.log('   ID de la chaîne:', channel.id);
    
    // 4. Vérifier si l'utilisateur suit déjà la chaîne
    console.log('\n5. Vérification si vous suivez déjà cette chaîne...');
    const isFollowing = await twitchAPI.checkFollowing(tokenInfo.userId, channel.id);
    
    if (isFollowing) {
      console.log('✅ Vous suivez déjà cette chaîne');
      
      // Option pour arrêter de suivre
      console.log('\n6. Arrêt du suivi de la chaîne...');
      await twitchAPI.unfollowChannel(tokenInfo.userId, channel.id, userToken);
      console.log('✅ Vous ne suivez plus la chaîne', channel.display_name);
    } else {
      console.log('❌ Vous ne suivez pas encore cette chaîne');
      
      // 5. Suivre la chaîne
      console.log('\n6. Suivi de la chaîne...');
      await twitchAPI.followChannel(tokenInfo.userId, channel.id, true, userToken);
      console.log('✅ Vous suivez maintenant la chaîne', channel.display_name);
    }
    
    // 6. Obtenir la liste des chaînes suivies
    console.log('\n7. Récupération de la liste des chaînes que vous suivez...');
    const followedChannels = await twitchAPI.getFollowedChannels(tokenInfo.userId, { first: 5 });
    
    console.log(`✅ Vous suivez ${followedChannels.total} chaînes, voici les 5 premières:`);
    followedChannels.data.forEach((follow, index) => {
      console.log(`   ${index + 1}. ${follow.to_name} (depuis ${new Date(follow.followed_at).toLocaleDateString()})`);
    });
    
    console.log('\n=== Fin de l\'exemple ===');
    console.log('L\'exemple s\'est exécuté avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur dans l\'exemple de suivi:', error.message);
    if (error.response) {
      console.error('Données d\'erreur:', error.response.data);
    }
  }
}

// Exécuter l'exemple
followExample();

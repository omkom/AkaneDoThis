import React from 'react';

export default function Story() {
  return (
    <section id="story" className="story py-20">
      <div className="container mx-auto px-4">
        <h2 className="neon-text cyan text-center text-4xl mb-12 font-cyber">Le Voyage Cyberpunk</h2>
        <div className="content-grid max-w-4xl mx-auto">
          <p className="story-text text-lg text-center mb-8 font-body">
            Des salles d'arcade rétro aux futurs cybernétiques, je construis une communauté où le gaming 
            rencontre l'art. Rejoignez-moi dans cet univers illuminé au néon de speedruns, 
            de programmation créative et de contenu innovant sur Twitch, YouTube et au-delà.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="card-3d-container">
              <div className="neo-card neo-card-blue card-3d p-6">
                <h3 className="neon-text cyan text-xl mb-4 font-cyber">Expertise Gaming</h3>
                <p className="font-body">Spécialisé dans les speedruns et les jeux à thème cyberpunk, j'apporte précision technique et stratégies créatives à chaque stream.</p>
              </div>
            </div>
            
            <div className="card-3d-container">
              <div className="neo-card neo-card-pink card-3d p-6">
                <h3 className="neon-text pink text-xl mb-4 font-cyber">Programmation Créative</h3>
                <p className="font-body">Au-delà du gaming, j'explore l'intersection du code et de l'art, créant des expériences numériques qui repoussent les limites des médias interactifs.</p>
              </div>
            </div>
            
            <div className="card-3d-container">
              <div className="neo-card neo-card-lime card-3d p-6">
                <h3 className="neon-text lime text-xl mb-4 font-cyber">Focus Communautaire</h3>
                <p className="font-body">Mes streams sont plus que du contenu—ils sont un lieu de rassemblement pour les passionnés de gaming, de technologie et d'art numérique.</p>
              </div>
            </div>
            
            <div className="card-3d-container">
              <div className="neo-card neo-card-purple card-3d p-6">
                <h3 className="neon-text purple text-xl mb-4 font-cyber">Vision Future</h3>
                <p className="font-body">J'évolue constamment mon contenu pour adopter les technologies émergentes et les tendances du gaming tout en restant fidèle à mon esthétique cyberpunk.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

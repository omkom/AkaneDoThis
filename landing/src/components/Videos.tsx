import React from 'react';

export default function Videos() {
  return (
    <section id="videos" className="py-20 bg-black/50">
      <div className="container mx-auto px-4">
        <h2 className="neon-text purple text-center text-4xl mb-12 font-cyber">Contenu à la Une</h2>
        
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="card-3d-container">
            <div className="neo-card neo-card-pink card-3d p-6">
              <h3 className="neon-text pink text-xl mb-4 font-cyber">Dernier Speedrun</h3>
              <div className="aspect-video bg-black/70 mb-4 flex items-center justify-center">
                <div className="text-center p-8">
                  <p className="text-neon-pink font-cyber mb-2">Miniature Vidéo</p>
                  <p className="font-body text-sm">Cyberpunk 2077 - Any% en 3:45:22</p>
                </div>
              </div>
              <p className="mb-4 font-body">Ma dernière course record à travers Night City, optimisant chaque itinéraire et exploitant chaque glitch.</p>
              <a href="#" className="inline-block px-6 py-2 border-2 border-neon-pink text-white hover:bg-neon-pink/20 transition duration-300 font-cyber">
                Regarder
              </a>
            </div>
          </div>
          
          <div className="card-3d-container">
            <div className="neo-card neo-card-blue card-3d p-6">
              <h3 className="neon-text cyan text-xl mb-4 font-cyber">Création Artistique</h3>
              <div className="aspect-video bg-black/70 mb-4 flex items-center justify-center">
                <div className="text-center p-8">
                  <p className="text-electric-blue font-cyber mb-2">Miniature Vidéo</p>
                  <p className="font-body text-sm">Création d'un Jeu Cyberpunk en 48 Heures</p>
                </div>
              </div>
              <p className="mb-4 font-body">Regardez-moi coder un jeu complet à thème cyberpunk à partir de zéro pendant un hackathon d'un week-end.</p>
              <a href="#" className="inline-block px-6 py-2 border-2 border-electric-blue text-white hover:bg-electric-blue/20 transition duration-300 font-cyber">
                Regarder
              </a>
            </div>
          </div>
          
          <div className="card-3d-container">
            <div className="neo-card neo-card-purple card-3d p-6">
              <h3 className="neon-text purple text-xl mb-4 font-cyber">Série Tutoriels</h3>
              <div className="aspect-video bg-black/70 mb-4 flex items-center justify-center">
                <div className="text-center p-8">
                  <p className="text-bright-purple font-cyber mb-2">Miniature Vidéo</p>
                  <p className="font-body text-sm">Techniques Avancées de Speedrun</p>
                </div>
              </div>
              <p className="mb-4 font-body">Apprenez les techniques avancées qui peuvent réduire des minutes de votre speedrun dans cette série complète de tutoriels.</p>
              <a href="#" className="inline-block px-6 py-2 border-2 border-bright-purple text-white hover:bg-bright-purple/20 transition duration-300 font-cyber">
                Voir la Série
              </a>
            </div>
          </div>
          
          <div className="card-3d-container">
            <div className="neo-card neo-card-lime card-3d p-6">
              <h3 className="neon-text lime text-xl mb-4 font-cyber">Moments Communautaires</h3>
              <div className="aspect-video bg-black/70 mb-4 flex items-center justify-center">
                <div className="text-center p-8">
                  <p className="text-vivid-lime font-cyber mb-2">Miniature Vidéo</p>
                  <p className="font-body text-sm">Meilleurs Moments des Jeux Communautaires</p>
                </div>
              </div>
              <p className="mb-4 font-body">Les moments les plus épiques, drôles et impressionnants de nos soirées jeux communautaires, tous dans une compilation.</p>
              <a href="#" className="inline-block px-6 py-2 border-2 border-vivid-lime text-white hover:bg-vivid-lime/20 transition duration-300 font-cyber">
                Regarder
              </a>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <a href="#" className="inline-block px-8 py-3 border-2 border-neon-pink text-white bg-black/30 hover:bg-neon-pink/20 transition duration-300 font-cyber">
            Voir Toutes les Vidéos
          </a>
        </div>
      </div>
    </section>
  );
}
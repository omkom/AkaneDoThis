import React from 'react';

const backgroundStyle = {
  backgroundImage: "url('/chanel-background-large.png')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
  position: 'relative',
};

export default function Community() {
  return (
    <section id="community" className="py-20" style={backgroundStyle}>
      <div className="container mx-auto px-4">
        <h2 className="neon-text pink text-center text-4xl mb-12 font-cyber">Rejoindre La Vibe de ma Communauté</h2>
        
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="card-3d-container">
            <div className="neo-card neo-card-blue card-3d p-6">
              <h3 className="neon-text cyan text-xl mb-4 font-cyber">Serveur Discord</h3>
              <p className="mb-4 font-body">Ma communauté, c’est une famille numérique de plus de 1 000 membres. Ici, on partage nos passions, nos créations et nos délires, toujours dans le respect et la bonne humeur. Entre discussions en live, sessions collaboratives et échanges de tips, tu trouveras toujours ta place.</p>
              <a href="https://discord.gg/H67aXsYNa7" className="inline-block px-6 py-2 border-2 border-electric-blue text-white hover:bg-electric-blue/20 transition duration-300 font-cyber">
                Rejoindre Discord
              </a>
            </div>
          </div>
          
          <div className="card-3d-container">
            <div className="neo-card neo-card-purple card-3d p-6">
              <h3 className="neon-text purple text-xl mb-4 font-cyber">Avantages Abonnés</h3>
              <ul className="list-disc list-inside mb-4 space-y-2 font-body">
                <li>Emotes et badges personnalisés</li>
                <li>Streams exclusifs aux abonnés</li>
                <li>Accès aux canaux Discord privés</li>
                <li>Voter pour le contenu à venir</li>
              </ul>
              <a href="#" className="inline-block px-6 py-2 border-2 border-bright-purple text-white hover:bg-bright-purple/20 transition duration-300 font-cyber">
                S'abonner
              </a>
            </div>
          </div>
          
          <div className="card-3d-container">
            <div className="neo-card neo-card-pink card-3d p-6">
              <h3 className="neon-text pink text-xl mb-4 font-cyber">Réseaux Sociaux</h3>
              <p className="mb-4 font-body">Suivez-moi sur les réseaux sociaux pour des mises à jour, du contenu en coulisses et plus de façons d'interagir avec la communauté.</p>
              <div className="flex space-x-4">
                <a href="https://www.instagram.com/_akanedothis/" className="text-white hover:text-neon-pink transition">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-electric-blue transition">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-vivid-lime transition">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="card-3d-container">
            <div className="neo-card neo-card-lime card-3d p-6">
              <h3 className="neon-text lime text-xl mb-4 font-cyber">Soutenir le Stream</h3>
              <p className="mb-4 font-body">Ton soutien est le carburant de ma créativité. En faisant un don, tu m’aides à créer du contenu encore plus innovant et à faire évoluer cette expérience unique.</p>
              <a href="https://streamlabs.com/akanedothis1/tip"  target="_blank" className="inline-block px-6 py-2 border-2 border-vivid-lime text-white hover:bg-vivid-lime/20 transition duration-300 font-cyber">
                Faire un Don
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

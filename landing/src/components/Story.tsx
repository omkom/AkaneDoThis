export default function Story() {
  return (
    <section id="story" className="story py-20">
      <div className="container mx-auto px-4">
        <h2 className="neon-text cyan text-center text-4xl mb-12 font-cyber">The Cyberpunk Journey</h2>
        <div className="content-grid max-w-4xl mx-auto">
          <p className="story-text text-lg text-center mb-8 font-body">
            From retro arcades to cybernetic futures, I'm building a community where gaming 
            meets art. Join me in this neon-lit universe of speedruns, creative coding, 
            and boundary-pushing content across Twitch, YouTube, and beyond.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="card-3d-container">
              <div className="neo-card neo-card-blue card-3d p-6">
                <h3 className="neon-text cyan text-xl mb-4 font-cyber">Gaming Expertise</h3>
                <p className="font-body">Specializing in speedruns and cyberpunk-themed games, I bring technical precision and creative strategies to every stream.</p>
              </div>
            </div>
            
            <div className="card-3d-container">
              <div className="neo-card neo-card-pink card-3d p-6">
                <h3 className="neon-text pink text-xl mb-4 font-cyber">Creative Coding</h3>
                <p className="font-body">Beyond gaming, I explore the intersection of code and art, creating digital experiences that push the boundaries of interactive media.</p>
              </div>
            </div>
            
            <div className="card-3d-container">
              <div className="neo-card neo-card-lime card-3d p-6">
                <h3 className="neon-text lime text-xl mb-4 font-cyber">Community Focus</h3>
                <p className="font-body">My streams are more than content—they're a gathering place for like-minded individuals passionate about gaming, technology, and digital art.</p>
              </div>
            </div>
            
            <div className="card-3d-container">
              <div className="neo-card neo-card-purple card-3d p-6">
                <h3 className="neon-text purple text-xl mb-4 font-cyber">Future Vision</h3>
                <p className="font-body">I'm constantly evolving my content to embrace emerging technologies and gaming trends while staying true to my cyberpunk aesthetic.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Videos() {
  return (
    <section id="videos" className="py-20 bg-black/50">
      <div className="container mx-auto px-4">
        <h2 className="neon-text purple text-center text-4xl mb-12 font-cyber">Featured Content</h2>
        
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="card-3d-container">
            <div className="neo-card neo-card-pink card-3d p-6">
              <h3 className="neon-text pink text-xl mb-4 font-cyber">Latest Speedrun</h3>
              <div className="aspect-video bg-black/70 mb-4 flex items-center justify-center">
                <div className="text-center p-8">
                  <p className="text-neon-pink font-cyber mb-2">Video Thumbnail</p>
                  <p className="font-body text-sm">Cyberpunk 2077 - Any% in 3:45:22</p>
                </div>
              </div>
              <p className="mb-4 font-body">My latest record-breaking run through Night City, optimizing every route and exploiting every glitch.</p>
              <a href="#" className="inline-block px-6 py-2 border-2 border-neon-pink text-white hover:bg-neon-pink/20 transition duration-300 font-cyber">
                Watch Now
              </a>
            </div>
          </div>
          
          <div className="card-3d-container">
            <div className="neo-card neo-card-blue card-3d p-6">
              <h3 className="neon-text cyan text-xl mb-4 font-cyber">Creative Showcase</h3>
              <div className="aspect-video bg-black/70 mb-4 flex items-center justify-center">
                <div className="text-center p-8">
                  <p className="text-electric-blue font-cyber mb-2">Video Thumbnail</p>
                  <p className="font-body text-sm">Building a Cyberpunk Game in 48 Hours</p>
                </div>
              </div>
              <p className="mb-4 font-body">Watch me code a complete cyberpunk-themed game from scratch during a weekend hackathon.</p>
              <a href="#" className="inline-block px-6 py-2 border-2 border-electric-blue text-white hover:bg-electric-blue/20 transition duration-300 font-cyber">
                Watch Now
              </a>
            </div>
          </div>
          
          <div className="card-3d-container">
            <div className="neo-card neo-card-purple card-3d p-6">
              <h3 className="neon-text purple text-xl mb-4 font-cyber">Tutorial Series</h3>
              <div className="aspect-video bg-black/70 mb-4 flex items-center justify-center">
                <div className="text-center p-8">
                  <p className="text-bright-purple font-cyber mb-2">Video Thumbnail</p>
                  <p className="font-body text-sm">Advanced Speedrunning Techniques</p>
                </div>
              </div>
              <p className="mb-4 font-body">Learn the advanced techniques that can shave minutes off your speedruns in this comprehensive tutorial series.</p>
              <a href="#" className="inline-block px-6 py-2 border-2 border-bright-purple text-white hover:bg-bright-purple/20 transition duration-300 font-cyber">
                Watch Series
              </a>
            </div>
          </div>
          
          <div className="card-3d-container">
            <div className="neo-card neo-card-lime card-3d p-6">
              <h3 className="neon-text lime text-xl mb-4 font-cyber">Community Highlights</h3>
              <div className="aspect-video bg-black/70 mb-4 flex items-center justify-center">
                <div className="text-center p-8">
                  <p className="text-vivid-lime font-cyber mb-2">Video Thumbnail</p>
                  <p className="font-body text-sm">Best Moments from Community Games</p>
                </div>
              </div>
              <p className="mb-4 font-body">The most epic, funny, and impressive moments from our community game nights, all in one compilation.</p>
              <a href="#" className="inline-block px-6 py-2 border-2 border-vivid-lime text-white hover:bg-vivid-lime/20 transition duration-300 font-cyber">
                Watch Now
              </a>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <a href="#" className="inline-block px-8 py-3 border-2 border-neon-pink text-white bg-black/30 hover:bg-neon-pink/20 transition duration-300 font-cyber">
            View All Videos
          </a>
        </div>
      </div>
    </section>
  );
}

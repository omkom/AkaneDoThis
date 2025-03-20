export default function Contact() {
  return (
    <section id="contact" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="neon-text blue text-center text-4xl mb-12 font-cyber">Get In Touch</h2>
        
        <div className="max-w-4xl mx-auto">
          <div className="card-3d-container">
            <div className="neo-card neo-card-blue card-3d p-8">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block mb-2 font-cyber text-electric-blue">Your Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      className="w-full p-3 bg-black/70 border-2 border-electric-blue focus:border-neon-pink outline-none transition font-body"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block mb-2 font-cyber text-electric-blue">Your Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      className="w-full p-3 bg-black/70 border-2 border-electric-blue focus:border-neon-pink outline-none transition font-body"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block mb-2 font-cyber text-electric-blue">Subject</label>
                  <input 
                    type="text" 
                    id="subject" 
                    className="w-full p-3 bg-black/70 border-2 border-electric-blue focus:border-neon-pink outline-none transition font-body"
                    placeholder="What's this about?"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block mb-2 font-cyber text-electric-blue">Message</label>
                  <textarea 
                    id="message" 
                    rows={5}
                    className="w-full p-3 bg-black/70 border-2 border-electric-blue focus:border-neon-pink outline-none transition font-body"
                    placeholder="Your message here..."
                  ></textarea>
                </div>
                
                <div className="text-center">
                  <button 
                    type="submit" 
                    className="px-8 py-3 bg-electric-blue text-black hover:bg-neon-pink transition duration-300 font-cyber"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="mt-16 grid md:grid-cols-3 gap-6 text-center">
            <div className="card-3d-container">
              <div className="neo-card neo-card-pink card-3d p-6">
                <h3 className="neon-text pink text-xl mb-4 font-cyber">Email</h3>
                <p className="font-body">contact@akane.productions</p>
              </div>
            </div>
            
            <div className="card-3d-container">
              <div className="neo-card neo-card-purple card-3d p-6">
                <h3 className="neon-text purple text-xl mb-4 font-cyber">Discord</h3>
                <p className="font-body">AkaneDoThis#1234</p>
              </div>
            </div>
            
            <div className="card-3d-container">
              <div className="neo-card neo-card-lime card-3d p-6">
                <h3 className="neon-text lime text-xl mb-4 font-cyber">Business Inquiries</h3>
                <p className="font-body">robert@akane.productions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState } from 'react';
import { trackFormSubmit } from '../utils/analytics';
import React from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track form submission with analytics
    trackFormSubmit('contact_form', {
      subject: formData.subject,
      has_message: formData.message.length > 0
    });
    
    // Logic to handle form submission
    console.log('Form submitted:', formData);
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    
    // Here you would normally send the data to your backend
  };

  return (
    <section id="contact" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="neon-text blue text-center text-4xl mb-12 font-cyber">Contactez-Moi</h2>
        
        <div className="max-w-4xl mx-auto">
          <div className="card-3d-container">
            <div className="neo-card neo-card-blue card-3d p-8">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block mb-2 font-cyber text-electric-blue">Votre Nom</label>
                    <input 
                      type="text" 
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full p-3 bg-black/70 border-2 border-electric-blue focus:border-neon-pink outline-none transition font-body"
                      placeholder="Entrez votre nom"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block mb-2 font-cyber text-electric-blue">Votre Email</label>
                    <input 
                      type="email" 
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-3 bg-black/70 border-2 border-electric-blue focus:border-neon-pink outline-none transition font-body"
                      placeholder="Entrez votre email"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block mb-2 font-cyber text-electric-blue">Sujet</label>
                  <input 
                    type="text" 
                    id="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full p-3 bg-black/70 border-2 border-electric-blue focus:border-neon-pink outline-none transition font-body"
                    placeholder="De quoi s'agit-il ?"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block mb-2 font-cyber text-electric-blue">Message</label>
                  <textarea 
                    id="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full p-3 bg-black/70 border-2 border-electric-blue focus:border-neon-pink outline-none transition font-body"
                    placeholder="Votre message ici..."
                    required
                  ></textarea>
                </div>
                
                <div className="text-center">
                  <button 
                    type="submit" 
                    className="px-8 py-3 bg-electric-blue text-black hover:bg-neon-pink transition duration-300 font-cyber"
                  >
                    Envoyer le Message
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
                <h3 className="neon-text lime text-xl mb-4 font-cyber">Professionnel</h3>
                <p className="font-body">robert@akane.productions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

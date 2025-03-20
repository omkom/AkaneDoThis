import { useState, useEffect } from 'react';

export default function Schedule() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Set next stream date (example: next Monday at 8PM)
    const getNextStreamDate = () => {
      const now = new Date();
      let nextStream = new Date();
      
      // Set to next Monday
      nextStream.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7));
      // Set to 8PM
      nextStream.setHours(20, 0, 0, 0);
      
      // If it's already past this Monday 8PM, go to next Monday
      if (now > nextStream) {
        nextStream.setDate(nextStream.getDate() + 7);
      }
      
      return nextStream;
    };

    const calculateTimeLeft = () => {
      const nextStream = getNextStreamDate();
      const difference = nextStream.getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    // Initial calculation
    calculateTimeLeft();
    
    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);
    
    // Cleanup
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="schedule" className="py-20 bg-black/70">
      <div className="container mx-auto px-4">
        <h2 className="neon-text lime text-center text-4xl mb-12 font-cyber">Stream Schedule</h2>
        
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 mb-12">
          <div className="card-3d-container">
            <div className="neo-card neo-card-blue card-3d p-6 text-center">
              <h3 className="neon-text cyan text-xl mb-2 font-cyber">Monday</h3>
              <p className="text-lg font-body">8:00 PM - 11:00 PM</p>
              <p className="mt-2 font-body">Speedrun Madness</p>
            </div>
          </div>
          
          <div className="card-3d-container">
            <div className="neo-card neo-card-pink card-3d p-6 text-center">
              <h3 className="neon-text pink text-xl mb-2 font-cyber">Wednesday</h3>
              <p className="text-lg font-body">8:00 PM - 11:00 PM</p>
              <p className="mt-2 font-body">Creative Coding</p>
            </div>
          </div>
          
          <div className="card-3d-container">
            <div className="neo-card neo-card-purple card-3d p-6 text-center">
              <h3 className="neon-text purple text-xl mb-2 font-cyber">Friday</h3>
              <p className="text-lg font-body">8:00 PM - 12:00 AM</p>
              <p className="mt-2 font-body">Community Game Night</p>
            </div>
          </div>
        </div>
        
        <div className="card-3d-container max-w-2xl mx-auto">
          <div className="neo-card neo-card-lime card-3d p-8 text-center">
            <h3 className="neon-text lime text-2xl mb-4 font-cyber">Next Stream Countdown</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4">
                <div className="text-3xl font-bold neon-text cyan">{timeLeft.days}</div>
                <div className="text-sm uppercase font-body">Days</div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-bold neon-text pink">{timeLeft.hours}</div>
                <div className="text-sm uppercase font-body">Hours</div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-bold neon-text lime">{timeLeft.minutes}</div>
                <div className="text-sm uppercase font-body">Minutes</div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-bold neon-text purple">{timeLeft.seconds}</div>
                <div className="text-sm uppercase font-body">Seconds</div>
              </div>
            </div>
            <p className="mt-6 font-body">Join me for the next stream and be part of the experience!</p>
            <a href="#" className="mt-4 inline-block px-6 py-2 border-2 border-vivid-lime text-white hover:bg-vivid-lime/20 transition duration-300 font-cyber">
              Set Reminder
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

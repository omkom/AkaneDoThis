import { useState, useEffect, useRef } from 'react';

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollPosition, setScrollPosition] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  
  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      }
    };
    
    // Track scroll position
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Calculate glitch intensity based on scroll
  const glitchIntensity = Math.min(scrollPosition / 500, 1);
  
  return (
    <section 
      id="home" 
      ref={heroRef}
      className="hero min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-jet-black relative overflow-hidden"
    >
      <div className="hero-content text-center z-10 px-4">
        <div className="mb-8 mx-auto w-40 h-40 rounded-full overflow-hidden border-4 border-neon-pink glow-effect">
          <img 
            src="https://static-cdn.jtvnw.net/jtv_user_pictures/258e0f7f-cdd0-4ab8-89f2-82d97993f474-profile_image-300x300.png"
            alt="AkaneDoThis" 
            className="w-full h-full object-cover"
          />
        </div>
        <h1 
          className="font-cyber text-5xl md:text-7xl font-bold mb-4 tracking-wider glitching-text"
          data-text="AkaneDoThis"
          style={{
            position: "relative",
            fontFamily: "'Orbitron', sans-serif",
            color: "#f6d8d5"
          }}
        >
          AkaneDoThis
        </h1>
        <style jsx>{`
          .glitching-text {
            text-shadow: 0.05em 0 0 #ec2225, -0.025em -0.05em 0 #313f97,
              0.025em 0.05em 0 #50c878;
            color: rgba(0, 194, 203, 0.2);
            animation: text-flicker 3s infinite;
          }
          
          .glitching-text:before,
          .glitching-text:after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            opacity: 0.8;
          }
          
          .glitching-text::before {
            animation: glitch 650ms infinite;
            clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
            transform: translate(-0.025em, -0.0125em);
          }
          
          .glitching-text::after {
            animation: glitch 375ms infinite;
            clip-path: polygon(0 65%, 100% 20%, 100% 100%, 0 70%);
            transform: translate(0.0125em, 0.025em);
          }
          
          @keyframes text-flicker {
            0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% {
              opacity: 0.99;
              text-shadow: 0.05em 0 0 #ec2225, -0.025em -0.05em 0 #313f97,
                0.025em 0.05em 0 #50c878;
            }
            20%, 21.999%, 63%, 63.999%, 65%, 69.999% {
              opacity: 0.4;
              text-shadow: none;
            }
          }
          
          @keyframes glitch {
            0% {
              color: rgba(236, 34, 37, 0.2);
              text-shadow: 0.05em 0 0 #ec2225, -0.025em -0.05em 0 #313f97,
                0.025em 0.05em 0 #50c878;
            }
            14% {
              text-shadow: 0.05em 0 0 #ec2225, -0.025em -0.05em 0 #313f97,
                0.025em 0.05em 0 #50c878;
            }
            15% {
              color: #50c878;
              text-shadow: -0.05em -0.025em 0 #ec2225, 0.025em -0.025em 0 #313f97,
                -0.05em -0.05em 0 #50c878;
            }
            49% {
              text-shadow: -0.05em -0.025em 0 #ec2225, 0.025em -0.025em 0 #313f97,
                -0.05em -0.05em 0 #50c878;
            }
            50% {
              text-shadow: 0.025em 0.05em 0 #ec2225, -0.025em 0.05em 0 #313f97,
                0 -0.05em 0 #50c878;
            }
            99% {
              color: #313f97;
              text-shadow: 0.025em 0.05em 0 #ec2225, -0.025em 0.05em 0 #313f97,
                0 -0.05em 0 #50c878;
            }
            100% {
              text-shadow: -0.025em 0 0 #ec2225, -0.025em -0.025em 0 #313f97,
                -0.025em -0.05em 0 #50c878;
            }
          }
        `}</style>
        <p className="font-body text-xl md:text-2xl mb-8 text-electric-blue tracking-wide">Plongez dans l'Univers Néon de la Créativité</p>
        <a href="#story" className="font-cyber mt-8 inline-block px-6 py-3 border-2 border-neon-pink text-white bg-black/30 backdrop-blur-sm hover:bg-neon-pink/20 transition duration-300 neon-text pink">
          Découvrir Mon Univers
        </a>
      </div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Scan lines effect */}
        <div className="scan-lines"></div>
        
        {/* Neon geometric frames */}
        <div className="neon-frame neon-frame-top"></div>
        <div className="neon-frame neon-frame-bottom"></div>
        
        {/* Original effects with reduced opacity */}
        <div className="neon-grid opacity-30"></div>
        <div className="cyber-particles opacity-30"></div>
        
        {/* Always-on glitch overlay */}
        <div className="glitch-overlay active"></div>
        
        {/* Always-on hacked screen distortion effects */}
        <div className="hacked-screen active"></div>
        <div className="digital-noise active"></div>
        <div className="glitch-blocks active"></div>
        <div className="distortion-wave active"></div>
        
        {/* Always-on full-width glitch layers */}
        <div className="full-width-glitch glitch-layer-1 active"></div>
        <div className="full-width-glitch glitch-layer-2 active"></div>
        <div className="full-width-glitch glitch-layer-3 active"></div>
        
        {/* Always-on RGB split effect */}
        <div className="rgb-split-horizontal active"></div>
        <div className="rgb-split-vertical active"></div>
        
        {/* Always-on scanline intensifier */}
        <div className="scanline-intensifier active"></div>
        
        {/* Always-on static noise overlay */}
        <div className="static-noise active"></div>
        
        {/* Always-on pixel sorting effect */}
        <div className="pixel-sort active"></div>
        
        {/* New mouse-reactive glitch layers */}
        <div 
          className="mouse-reactive-glitch" 
          style={{
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            opacity: 0.7
          }}
        ></div>
        
        {/* New scroll-reactive noise layers */}
        <div 
          className="scroll-reactive-noise" 
          style={{
            opacity: glitchIntensity * 0.3
          }}
        ></div>
        
        {/* Additional "neige" (snow/noise) layers */}
        <div className="neige-layer neige-layer-1"></div>
        <div className="neige-layer neige-layer-2"></div>
        <div className="neige-layer neige-layer-3"></div>
        
        {/* Random glitch blocks that appear and disappear */}
        <div className="random-glitch-block block-1"></div>
        <div className="random-glitch-block block-2"></div>
        <div className="random-glitch-block block-3"></div>
        <div className="random-glitch-block block-4"></div>
        
        {/* VHS tracking lines */}
        <div className="vhs-tracking"></div>
        
        {/* Digital artifacts */}
        <div className="digital-artifacts"></div>
      </div>
      
      {/* CSS for the glitch effects */}
      <style jsx>{`
        /* Always-on glitch effects */
        .glitch-overlay.active {
          opacity: 0.5;
          animation: glitch-shift 0.2s infinite steps(2);
        }
        
        .hacked-screen.active {
          opacity: 0.5;
          animation: screen-flicker 4s infinite;
        }
        
        .digital-noise.active {
          opacity: 0.1;
          animation: noise-shift 0.1s infinite;
        }
        
        .glitch-blocks.active {
          opacity: 0.4;
          animation: random-blocks 5s infinite;
        }
        
        .distortion-wave.active {
          opacity: 0.4;
          animation: wave-shift 4s infinite cubic-bezier(0.42, 0, 0.58, 1);
        }
        
        /* Full width glitch layers */
        .full-width-glitch {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 4;
        }
        
        .full-width-glitch.active {
          opacity: 0.3;
        }
        
        .glitch-layer-1 {
          background: linear-gradient(90deg, 
            transparent 5%, 
            rgba(255, 0, 255, 0.1) 5%, 
            rgba(255, 0, 255, 0.1) 10%, 
            transparent 10%,
            transparent 15%,
            rgba(0, 255, 255, 0.1) 15%,
            rgba(0, 255, 255, 0.1) 20%,
            transparent 20%
          );
          background-size: 200% 100%;
          animation: glitch-layer-1 0.3s steps(30) infinite alternate-reverse;
        }
        
        .glitch-layer-2 {
          background: linear-gradient(0deg, 
            transparent 10%, 
            rgba(255, 255, 0, 0.1) 10%, 
            rgba(255, 255, 0, 0.1) 15%, 
            transparent 15%,
            transparent 65%,
            rgba(255, 0, 0, 0.1) 65%,
            rgba(255, 0, 0, 0.1) 70%,
            transparent 70%
          );
          background-size: 100% 200%;
          animation: glitch-layer-2 0.4s steps(20) infinite;
        }
        
        .glitch-layer-3 {
          background: radial-gradient(
            circle at 50% 50%,
            transparent 40%,
            rgba(0, 255, 255, 0.1) 40%,
            rgba(0, 255, 255, 0.1) 50%,
            transparent 50%,
            transparent 60%,
            rgba(255, 0, 255, 0.1) 60%,
            rgba(255, 0, 255, 0.1) 70%,
            transparent 70%
          );
          background-size: 200% 200%;
          animation: glitch-layer-3 4s ease infinite alternate;
        }
        
        /* RGB split effects */
        .rgb-split-horizontal {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg,
            rgba(255, 0, 0, 0.1) 0%,
            transparent 20%,
            transparent 40%,
            rgba(0, 255, 0, 0.1) 40%,
            transparent 60%,
            transparent 80%,
            rgba(0, 0, 255, 0.1) 80%,
            transparent 100%
          );
          opacity: 0;
          mix-blend-mode: screen;
          z-index: 4;
          animation: rgb-shift-horizontal 0.3s infinite alternate;
        }
        
        .rgb-split-horizontal.active {
          opacity: 0.3;
        }
        
        .rgb-split-vertical {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(0deg,
            rgba(255, 0, 0, 0.1) 0%,
            transparent 20%,
            transparent 40%,
            rgba(0, 255, 0, 0.1) 40%,
            transparent 60%,
            transparent 80%,
            rgba(0, 0, 255, 0.1) 80%,
            transparent 100%
          );
          opacity: 0;
          mix-blend-mode: screen;
          z-index: 4;
          animation: rgb-shift-vertical 0.5s infinite alternate;
        }
        
        .rgb-split-vertical.active {
          opacity: 0.3;
        }
        
        /* Scanline intensifier */
        .scanline-intensifier {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.2),
            rgba(0, 0, 0, 0.2) 1px,
            transparent 1px,
            transparent 2px
          );
          opacity: 0;
          pointer-events: none;
          z-index: 5;
          animation: scanline-move 10s linear infinite;
        }
        
        .scanline-intensifier.active {
          opacity: 0.5;
        }
        
        /* Static noise overlay */
        .static-noise {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0;
          mix-blend-mode: overlay;
          z-index: 5;
          pointer-events: none;
        }
        
        .static-noise.active {
          opacity: 0.08;
          animation: static-flicker 0.1s infinite;
        }
        
        /* Pixel sorting effect */
        .pixel-sort {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 1px,
            rgba(255, 0, 255, 0.1) 1px,
            rgba(255, 0, 255, 0.1) 2px,
            transparent 2px,
            transparent 3px,
            rgba(0, 255, 255, 0.1) 3px,
            rgba(0, 255, 255, 0.1) 4px
          );
          opacity: 0;
          mix-blend-mode: screen;
          z-index: 4;
          transform: scaleY(20);
          filter: blur(1px);
        }
        
        .pixel-sort.active {
          opacity: 0.2;
          animation: pixel-sort-shift 2s infinite alternate;
        }
        
        /* Mouse-reactive glitch */
        .mouse-reactive-glitch {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 0, 255, 0.1) 0%,
            rgba(0, 255, 255, 0.1) 30%,
            transparent 70%
          );
          mix-blend-mode: screen;
          transform: translate(-50%, -50%);
          filter: blur(10px);
          z-index: 3;
          pointer-events: none;
          animation: pulse 2s infinite alternate;
        }
        
        /* Scroll-reactive noise */
        .scroll-reactive-noise {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
          z-index: 4;
          pointer-events: none;
        }
        
        /* Neige (snow/noise) layers */
        .neige-layer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 3;
          opacity: 0.05;
        }
        
        .neige-layer-1 {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          animation: neige-drift-1 120s linear infinite;
        }
        
        .neige-layer-2 {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.4' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          animation: neige-drift-2 80s linear infinite;
        }
        
        .neige-layer-3 {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          animation: neige-drift-3 60s linear infinite;
        }
        
        /* Random glitch blocks */
        .random-glitch-block {
          position: absolute;
          background: rgba(255, 0, 255, 0.2);
          mix-blend-mode: screen;
          z-index: 4;
          pointer-events: none;
        }
        
        .block-1 {
          top: 20%;
          left: 10%;
          width: 50px;
          height: 20px;
          animation: random-appear-1 10s infinite;
        }
        
        .block-2 {
          top: 50%;
          right: 15%;
          width: 30px;
          height: 80px;
          animation: random-appear-2 7s infinite;
        }
        
        .block-3 {
          bottom: 30%;
          left: 30%;
          width: 80px;
          height: 15px;
          animation: random-appear-3 13s infinite;
        }
        
        .block-4 {
          top: 70%;
          right: 25%;
          width: 40px;
          height: 40px;
          animation: random-appear-4 9s infinite;
        }
        
        /* VHS tracking lines */
        .vhs-tracking {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 50px,
            rgba(255, 255, 255, 0.1) 50px,
            rgba(255, 255, 255, 0.1) 51px
          );
          opacity: 0.3;
          pointer-events: none;
          z-index: 3;
          animation: tracking-shift 10s infinite;
        }
        
        /* Digital artifacts */
        .digital-artifacts {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(90deg, transparent 99.5%, rgba(255, 0, 255, 0.5) 99.5%),
            linear-gradient(0deg, transparent 99.5%, rgba(0, 255, 255, 0.5) 99.5%);
          background-size: 100px 100px;
          opacity: 0.2;
          pointer-events: none;
          z-index: 3;
          animation: artifacts-shift 5s infinite alternate;
        }
        
        /* Animations for the new effects */
        @keyframes glitch-layer-1 {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 200% 0%;
          }
        }
        
        @keyframes glitch-layer-2 {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 0% 200%;
          }
        }
        
        @keyframes glitch-layer-3 {
          0% {
            background-position: 0% 0%;
            transform: scale(1);
          }
          50% {
            background-position: 100% 100%;
            transform: scale(1.2);
          }
          100% {
            background-position: 0% 0%;
            transform: scale(1);
          }
        }
        
        @keyframes rgb-shift-horizontal {
          0% {
            transform: translateX(-5px);
          }
          100% {
            transform: translateX(5px);
          }
        }
        
        @keyframes rgb-shift-vertical {
          0% {
            transform: translateY(-3px);
          }
          100% {
            transform: translateY(3px);
          }
        }
        
        @keyframes scanline-move {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 100%;
          }
        }
        
        @keyframes static-flicker {
          0% {
            opacity: 0.05;
          }
          50% {
            opacity: 0.08;
          }
          100% {
            opacity: 0.1;
          }
        }
        
        @keyframes pixel-sort-shift {
          0% {
            opacity: 0.15;
            transform: scaleY(20) translateY(-2px);
          }
          50% {
            opacity: 0.2;
            transform: scaleY(25) translateY(0px);
          }
          100% {
            opacity: 0.15;
            transform: scaleY(20) translateY(2px);
          }
        }
        
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.5;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.7;
          }
        }
        
        @keyframes neige-drift-1 {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 100% 100%;
          }
        }
        
        @keyframes neige-drift-2 {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: 0 100%;
          }
        }
        
        @keyframes neige-drift-3 {
          0% {
            background-position: 0 100%;
          }
          100% {
            background-position: 100% 0;
          }
        }
        
        @keyframes random-appear-1 {
          0%, 90%, 100% {
            opacity: 0;
          }
          10%, 80% {
            opacity: 1;
          }
        }
        
        @keyframes random-appear-2 {
          0%, 20%, 100% {
            opacity: 0;
          }
          30%, 90% {
            opacity: 1;
          }
        }
        
        @keyframes random-appear-3 {
          0%, 50%, 100% {
            opacity: 0;
          }
          60%, 95% {
            opacity: 1;
          }
        }
        
        @keyframes random-appear-4 {
          0%, 70%, 100% {
            opacity: 0;
          }
          75%, 95% {
            opacity: 1;
          }
        }
        
        @keyframes tracking-shift {
          0%, 100% {
            transform: translateY(0);
          }
          10% {
            transform: translateY(20px);
          }
          20% {
            transform: translateY(-10px);
          }
          30% {
            transform: translateY(5px);
          }
          40% {
            transform: translateY(-15px);
          }
          50% {
            transform: translateY(0);
          }
          60% {
            transform: translateY(10px);
          }
          70% {
            transform: translateY(-5px);
          }
          80% {
            transform: translateY(15px);
          }
          90% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes artifacts-shift {
          0% {
            background-position: 0 0;
            opacity: 0.1;
          }
          50% {
            background-position: 50px 20px;
            opacity: 0.2;
          }
          100% {
            background-position: 100px 50px;
            opacity: 0.1;
          }
        }
      `}</style>
    </section>
  );
}

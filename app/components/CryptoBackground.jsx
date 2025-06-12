"use client"
import { useEffect } from 'react';
import { Slider } from './Slider';
const CryptoBackground = () => {
  useEffect(() => {
    const createParticles = () => {
      const particlesContainer = document.getElementById('particles');
      if (!particlesContainer) return;
      
      const particleCount = 50;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 12 + 's';
        particle.style.animationDuration = (Math.random() * 8 + 8) + 's';
        
        // Random colors
        const colors = [
          'rgba(99, 102, 241, 0.6)',
          'rgba(147, 51, 234, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(16, 185, 129, 0.6)'
        ];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        particlesContainer.appendChild(particle);
      }
    };

    createParticles();
  }, []);

  return (
    <>
      <style jsx>{`
        .crypto-background {
          position: absolute;
          inset: 0;
          z-index: -10;
          height: 100vh;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1.25rem 1.25rem 6rem;
          background: radial-gradient(125% 125% at 50% 10%, #000 35%, #1a0033 70%, #6366f1 100%);
          overflow: hidden;
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridMove 20s linear infinite;
          opacity: 0.3;
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }

        .floating-shapes {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .shape {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(45deg, rgba(99, 102, 241, 0.3), rgba(147, 51, 234, 0.3));
          filter: blur(1px);
          animation: float 15s ease-in-out infinite;
        }

        .shape:nth-child(1) {
          width: 120px;
          height: 120px;
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }

        .shape:nth-child(2) {
          width: 80px;
          height: 80px;
          top: 60%;
          right: 15%;
          animation-delay: -5s;
          background: linear-gradient(45deg, rgba(147, 51, 234, 0.3), rgba(59, 130, 246, 0.3));
        }

        .shape:nth-child(3) {
          width: 150px;
          height: 150px;
          bottom: 25%;
          left: 20%;
          animation-delay: -10s;
          background: linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.2));
        }

        .shape:nth-child(4) {
          width: 60px;
          height: 60px;
          top: 15%;
          right: 30%;
          animation-delay: -7s;
        }

        .shape:nth-child(5) {
          width: 100px;
          height: 100px;
          bottom: 40%;
          right: 25%;
          animation-delay: -12s;
          background: linear-gradient(45deg, rgba(16, 185, 129, 0.3), rgba(245, 158, 11, 0.3));
        }

        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg) scale(1);
          }
          25% { 
            transform: translateY(-30px) translateX(20px) rotate(90deg) scale(1.1);
          }
          50% { 
            transform: translateY(-10px) translateX(-15px) rotate(180deg) scale(0.9);
          }
          75% { 
            transform: translateY(-40px) translateX(10px) rotate(270deg) scale(1.05);
          }
        }

        .particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(99, 102, 241, 0.6);
          border-radius: 50%;
          animation: particleFloat 12s linear infinite;
        }

        @keyframes particleFloat {
          0% {
            transform: translateY(100vh) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-10vh) translateX(100px);
            opacity: 0;
          }
        }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%);
          filter: blur(2px);
          animation: pulse 8s ease-in-out infinite;
        }

        .glow-orb:nth-child(1) {
          width: 300px;
          height: 300px;
          top: -150px;
          right: -150px;
          animation-delay: 0s;
        }

        .glow-orb:nth-child(2) {
          width: 400px;
          height: 400px;
          bottom: -200px;
          left: -200px;
          animation-delay: -4s;
          background: radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%);
        }

        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.3;
          }
          50% { 
            transform: scale(1.2);
            opacity: 0.6;
          }
        }

        @media (max-width: 768px) {
          .shape {
            transform: scale(0.7);
          }
        }
      `}</style>
      
      <div className="crypto-background">
        {/* Grid overlay */}
        <div className="grid-overlay"></div>
        
        {/* Glowing orbs */}
        <div className="glow-orb"></div>
        <div className="glow-orb"></div>
        <Slider></Slider>
        {/* Floating shapes */}
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
        <div className="particles" id="particles"></div>
      </div>
    </>
  );
};

export default CryptoBackground;
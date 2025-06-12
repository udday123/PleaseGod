"use client";
import React, { useEffect, useState } from "react";

export const Slider = () => {
  const [index, setIndex] = useState(0);
  const [sprinkles, setSprinkles] = useState<Array<{
    delay: string;
    duration: string;
    x: string;
    y: string;
    size: string;
    opacity: string;
    direction: string;
  }>>([]);
  const size = 4;

  // Define image size here so it's easy to change
  const width = 1200;
  const height = 500;

  const images = [
    "/sliderimages/wallhaven-odkm7p_3840x1600.png",
    "/sliderimages/wallhaven-01o72w_3840x1600.png",
    "/sliderimages/wallhaven-4go57e_3840x2160.png",
    "/sliderimages/Screenshot (1542).png",
  ];

  const texts = [
    <div key="text-0"> {/* Added key */}
      <div className="text-4xl pr-148 sm:text-5xl md:text-6xl font-extrabold text-cyan-50 text-center px-4 drop-shadow-lg">
        We Don&apos;t Watch the Market… {/* Escaped apostrophe */}
      </div>
      <div className="pr-149 text-3xl">
        We Haunt It.
      </div>
    </div>,
    <div key="text-1"> {/* Added key */}
      <div className="text-4xl pr-138 sm:text-5xl md:text-6xl font-extrabold text-cyan-50 text-center px-4 drop-shadow-lg">
        Be the Market&apos;s Final Boss {/* Escaped apostrophe */}
      </div>
      <div className="pr-128 text-3xl">
        Crush volatility. Dominate every candle.
      </div>
    </div>,
    <div key="text-2"> {/* Added key */}
      <div
        className="text-4xl pr-148 sm:text-5xl md:text-6xl font-extrabold text-center px-4 drop-shadow-lg bg-clip-text text-transparent"
        style={{
          backgroundImage: "linear-gradient(145deg, black 26.9%, white 30%)"
        }}
      >
        The Smile Isn&apos;t Mine... {/* Escaped apostrophe */}
        <div 
          className="bg-gradient-to-r text-transparent bg-clip-text text-2xl"
          style={{
            backgroundImage: "linear-gradient(155deg, black 26.6%, white 30%)"
          }}
        >
          It&apos;s the last thing the market sees before I break it. {/* Escaped apostrophe */}
        </div>
      </div>
    </div>,
    <div key="text-3"> {/* Added key */}
      <div className="text-4xl pr-198 sm:text-5xl md:text-6xl font-extrabold text-cyan-50 text-center px-4 drop-shadow-lg">
        Your Crypto, Your Rules
      </div>
      <div className="pr-180 text-3xl">Buy, sell, and HOLD with complete control.</div>
    </div>,
  ];

  // Generate sprinkle values on client-side only
  useEffect(() => {
    const newSprinkles = Array.from({ length: 100 }, () => ({
      delay: `${Math.random() * 5}s`,
      duration: `${3 + Math.random() * 4}s`,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      size: `${2 + Math.random() * 4}px`,
      opacity: `${0.2 + Math.random() * 0.5}`,
      direction: Math.random() > 0.5 ? 'up' : 'down'
    }));
    setSprinkles(newSprinkles);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % size);
    }, 4000);

    return () => clearInterval(interval);
  }, [size]);

  return (
    <div
      className="relative overflow-hidden rounded shadow-lg transition-all duration-500"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div
        className="flex transition-transform duration-1000 ease-in-out"
        style={{
          width: `${width * size}px`,
          transform: `translateX(-${index * width}px)`,
        }}
      >
        {images.map((img, i) => (
          <div
            key={i}
            style={{ width: `${width}px`, height: `${height}px` }}
            className="relative shrink-0"
          >
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="sprinkle-container">
                {sprinkles.map((sprinkle, j) => (
                  <div
                    key={j}
                    className={`sprinkle ${sprinkle.direction}`}
                    style={{
                      '--delay': sprinkle.delay,
                      '--duration': sprinkle.duration,
                      '--x': sprinkle.x,
                      '--y': sprinkle.y,
                      '--size': sprinkle.size,
                      '--opacity': sprinkle.opacity,
                    } as React.CSSProperties}
                  />
                ))}
              </div>
            </div>
            <img
              src={img}
              alt={`Slide ${i}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 text-white text-lg text-center p-3">
              {texts[i]}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .sprinkle-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .sprinkle {
          position: absolute;
          width: var(--size);
          height: var(--size);
          background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
          border-radius: 50%;
          left: var(--x);
          top: var(--y);
          opacity: 0;
          animation: float var(--duration) ease-in-out var(--delay) infinite;
        }

        .sprinkle.up {
          animation-name: float-up;
        }

        .sprinkle.down {
          animation-name: float-down;
        }

        @keyframes float-up {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0);
          }
          20% {
            opacity: var(--opacity);
            transform: translateY(0) scale(1);
          }
          80% {
            opacity: var(--opacity);
            transform: translateY(-20px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-40px) scale(0);
          }
        }

        @keyframes float-down {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0);
          }
          20% {
            opacity: var(--opacity);
            transform: translateY(0) scale(1);
          }
          80% {
            opacity: var(--opacity);
            transform: translateY(20px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(40px) scale(0);
          }
        }
      `}</style>
    </div>
  );
};
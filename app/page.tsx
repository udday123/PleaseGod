"use client"
import { useState } from "react";

import MarketCapList from "./components/MultipleCurrencyBlock";
import Popular from "./components/Popular";
import { Slider } from "./components/Slider";
import TopGainers from "./components/TopGainers";
import TopLooser from "./components/TopLosser";
import FuturesMarket from "./components/FuturesMarket";

export default function Page() {
  const [activeView, setActiveView] = useState<'spot' | 'futures'>('spot');

  return (
    <div className="relative min-h-screen flex flex-col px-5 py-24">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: 'radial-gradient(125% 125% at 50% 10%, #000 40%, #63e 100%)',
          minHeight: '100vh',
        }}
      />

      {/* Slider section */}
      <div className=" hidden lg:block  w-full max-w-7xl mx-auto mb-16 justify-center justify-items-center">
        <Slider />
      </div>

      {/* Gainers / Loosers section */}
      <div className="w-full max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <TopGainers />
        <TopLooser />
        <Popular/>
      </div>
      <div className="w-full px-4 sm:px-6 lg:px-8">
  <div className="h-6" />

  {/* Tabs */}
  <div className="grid grid-cols-2 w-fit text-white">
    

  </div>

  {/* Animated Views */}
  <div className="relative mt-4">
    <button 
      onClick={() => setActiveView('spot')}
      className={`bg-transparent h-10 text-amber-50 font-extrabold text-lg rounded-tl-lg px-4 ml-4 py-2 shadow-[-3px_-2px_10px_rgba(255,255,255,0.3)] hover:cursor-pointer ${
        activeView === 'spot' ? 'bg-gray-800' : ''
      }`}
    >
      Spot
    </button>
    <div 
      className={`absolute w-full transition-all duration-500 ease-in-out ${
        activeView === 'spot' ? 'animate-fadeIn z-10' : 'animate-fadeOut z-0'
      }`}
    >
      <MarketCapList />
    </div>
    <div 
      className={`absolute w-full transition-all duration-500 ease-in-out ${
        activeView === 'futures' ? 'animate-fadeIn z-10' : 'animate-fadeOut z-0'
      }`}
    >
    </div>
  </div>
      </div>


      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out forwards;
        }
        .animate-fadeOut {
          animation: fadeOut 0.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}

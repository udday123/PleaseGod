'use client';

import { useParams } from "next/navigation";
import MarketBar from "../components/MarketBar";
import OrderBook from "../components/Orderbook";
import TradesSection from "../components/TradeSection";
import TradeView from "../components/TradeView";
import { HistorySection } from "../components/HistorySection";
import { useState, useEffect } from "react";

export default function Mainpage() {
  const params = useParams();
  const focusmarket = params?.focusmarket?.toString();

  const [windowWidth, setWindowWidth] = useState(1200);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    setWindowWidth(window.innerWidth); // set once after mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!hasMounted) return null; // ✅ prevent hydration mismatch

  if (!focusmarket)
    return <div className="text-center p-4 text-white">Market not found.</div>;

  const backpackMarket = focusmarket;
  const isMobile = windowWidth < 850;
  const showOrderBook = windowWidth >= 1100;
  const showTradesSection = windowWidth >= 850;

  return (
    <div className="bg-gray-800 w-full min-h-screen flex flex-col sm:p-2 p-0">
      <MarketBar market={backpackMarket} />

      <div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-2 mt-2 w-full`}>
        <div
          className={`rounded-2xl overflow-hidden shadow-lg
            h-[480px] md:h-[580px] xs:h-[300px]
            w-full transition-all duration-300
            ${!isMobile && (showOrderBook || showTradesSection) ? "lg:flex-grow" : ""}
          `}
        >
          <TradeView market={backpackMarket} />
        </div>

        {showOrderBook && (
          <div
            className="flex flex-col rounded-lg p-2 max-w-[260px] h-[577px]"
            style={{ minWidth: 260, backgroundColor: "#0f0f0f" }}
          >
            <div className="flex text-xs font-medium text-slate-400 mb-2 select-none">
              <div className="flex-1">Price (USD)</div>
              <div className="flex-[0.4] pl-1">Size</div>
              <div className="flex-1 text-center">Total</div>
            </div>
            <div className="overflow-auto max-h-[700px]">
              <OrderBook market={backpackMarket} />
            </div>
          </div>
        )}

        {showTradesSection && (
          <div
            className="w-[260px] bg-black rounded-lg text-white max-h-[547px]"
            style={{ minWidth: 260 }}
          >
            <TradesSection market={backpackMarket} />
          </div>
        )}
      </div>

      {/* ✅ Fixed: Full width trades section on mobile */}
      {isMobile && (
        <div className="mt-2 w-full text-white">
          <TradesSection market={backpackMarket} />
        </div>
      )}

      {/* ✅ Hidden OrderBook on mobile */}
      {/* Removed mobile OrderBook rendering */}

      <div className="w-full mt-4 overflow-x-hidden px-2 sm:px-1">
        <div className="w-full">
          <HistorySection />
        </div>
      </div>
    </div>
  );
}

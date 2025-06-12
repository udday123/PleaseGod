'use client';
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import MarketBar from "../components/MarketBar";
import OrderBook from "../components/Orderbook";
import TradesSection from "../components/TradeSection";
import { useState, useEffect } from "react";
import TradeView from "../components/TradeView";
import { HistorySection } from "../components/HistorySection";

const AdvancedRealTimeChart = dynamic(
  () => import("react-ts-tradingview-widgets").then((mod) => mod.AdvancedRealTimeChart),
  { ssr: false }
);

export default function Mainpage() {
  const params = useParams();
  const focusmarket = params?.focusmarket?.toString();

  const [BookOrTrade, setBookTrade]=("Book")

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!focusmarket)
    return <div className="text-center p-4 text-white">Market not found.</div>;

  const backpackMarket = focusmarket;

  // Decide which panels to show based on window width
  const showOrderBook = windowWidth >= 1100;
  const showTradesSection = windowWidth >= 850;

  return (
    <div className="bg-gray-800 w-full min-h-screen p-2 flex flex-col xs:p-1">
      <MarketBar market={backpackMarket} />
      <div
        className="flex flex-grow gap-2 mt-2 lg:flex-row"
        style={{ flexWrap: "nowrap" }} // prevent wrapping or dropping TradeSection below
      >
        {/* Chart */}
        <div
          className={`rounded-2xl overflow-hidden shadow-lg
                      h-[480px] md:h-[580px] xs:h-[300px]
                      flex-grow transition-all duration-300
                      ${
                        showOrderBook && showTradesSection
                          ? "max-w-[calc(100%-520px)]"
                          : ""
                      }
                      ${
                        !showOrderBook && showTradesSection
                          ? "max-w-[calc(100%-260px)]"
                          : ""
                      }
                      ${!showOrderBook && !showTradesSection ? "max-w-full" : ""}
          `}
        >
          <TradeView market={backpackMarket}></TradeView>
          {/* <AdvancedRealTimeChart
            autosize
            show_popup_button={true}
            theme="dark"
            symbol={backpackMarket.replace("_", "")}
          /> */}
        </div>

        {/* OrderBook - only if wide enough */}
        {showOrderBook && (
          <div
            className="flex flex-col rounded-lg p-2 max-w-[260px] h-145"
            style={{ minWidth: 260 , backgroundColor: "#0f0f0f"}}
          >
            <div className="flex text-xs font-medium text-slate-400 mb-2 select-none xs:text-[10px] xs:mb-1">
              <div className="flex-1  ">Price (USD)</div>
              <div className="flex-[0.4] text-left pl-1">&nbsp;&nbsp;&nbsp;&nbsp;Size</div>
              <div className="flex-1 text-center pl-4">&nbsp;&nbsp;&nbsp;&nbsp;Total</div>
            </div>
            <div className="overflow-auto max-h-[350x] xs:max-h-[180px]">
              <OrderBook market={backpackMarket} />
            </div>
          </div>
        )}

        {/* TradesSection - only if wide enough, and never wrap */}
        {showTradesSection && (
          <div
            className="w-[260px] bg-black rounded-lg text-white no-scrollbar max-h-[547px] xs:max-h-[400px]"
            style={{ minWidth: 260 }}
          >
            <TradesSection market={backpackMarket} />
          </div>
        )}
      </div>
      <HistorySection/>
    </div>
  );
}

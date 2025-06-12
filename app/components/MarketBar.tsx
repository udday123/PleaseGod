"use client";

import { useEffect, useState } from "react";
import { Ticker as TickerType } from "../utils/types";
import { SinglingManager } from "../utils/SignilingManager";
import { getTicker } from "../utils/httpClient";

export default function MarketBar({ market }: { market: string }) {
  const [ticker, setTicker] = useState<TickerType | null>(null);

  if(market.includes("USDC_PERP")){

  }

  useEffect(() => {
    getTicker(market).then(setTicker);

    const instance = SinglingManager.getInstance();

    instance.registerCallback(
      "ticker",
      (data: Partial<TickerType>) =>
        setTicker((prev) => ({
          firstPrice: data?.firstPrice ?? prev?.firstPrice ?? '',
          high: data?.high ?? prev?.high ?? '',
          lastPrice: data?.lastPrice ?? prev?.lastPrice ?? '',
          low: data?.low ?? prev?.low ?? '',
          priceChange: data?.priceChange ?? prev?.priceChange ?? '',
          priceChangePercent: data?.priceChangePercent ?? prev?.priceChangePercent ?? '',
          quoteVolume: data?.quoteVolume ?? prev?.quoteVolume ?? '',
          symbol: data?.symbol ?? prev?.symbol ?? '',
          trades: data?.trades ?? prev?.trades ?? '',
          volume: data?.volume ?? prev?.volume ?? '',
        })),
      `TICKER-${market}`
    );

    instance.sendMessage({ method: "SUBSCRIBE", params: [`ticker.${market}`] });

    return () => {
      instance.deRegisterCallback("ticker", `TICKER-${market}`);
      instance.sendMessage({ method: "UNSUBSCRIBE", params: [`ticker.${market}`] });
    };
  }, [market]);

  const isPositiveChange = Number(ticker?.priceChangePercent) > 0;
  const changeColor = isPositiveChange ? "text-green-500" : "text-red-500";

  return (
    <div
      className="flex items-center bg-black text-white p-2 rounded-lg ml-1.5 text-xs sm:text-sm"
      style={{ height: 60, overflow: "hidden", whiteSpace: "nowrap" }}
    >
      <div className="flex items-center mr-4 flex-shrink-0">
        <img
          src={`/images/${market}.svg`}
          alt={`${market} logo`}
          className="w-6 h-6 mr-2"
        />
        <span className="font-bold mr-1">{market.slice(0, -5)}</span>
        <span className="text-gray-400">/USD</span>
      </div>

      <div className="flex flex-col mr-6 flex-shrink-0">
        <span className="font-bold text-lg">{Number(ticker?.lastPrice || 0).toFixed(1)}</span>
        <span className="text-sm text-gray-400">${ticker?.lastPrice || "--"}</span>
      </div>

      <div className="flex gap-6 sm:gap-10 overflow-hidden">
        <div className="flex flex-col flex-shrink-0 min-w-[100px]">
          <span className="text-gray-400">24H Change</span>
          <span className={`font-semibold ${changeColor}`}>
            {ticker?.priceChange || "--"} = {(Number(ticker?.priceChangePercent)*100).toFixed(3) || "--"}%
          </span>
        </div>

        <div className="flex flex-col flex-shrink-0 min-w-[100px]">
          <span className="text-gray-400">24H High</span>
          <span className="font-semibold">{ticker?.high || "--"}</span>
        </div>

        <div className="flex flex-col flex-shrink-0 min-w-[100px]">
          <span className="text-gray-400">24H Low</span>
          <span className="font-semibold">{ticker?.low || "--"}</span>
        </div>

        <div className="flex flex-col flex-shrink-0 min-w-[140px] truncate">
          <span className="text-gray-400">24H Volume (USD)</span>
          <span className="font-semibold truncate">{ticker?.quoteVolume || "--"}</span>
        </div>
      </div>
    </div>
  );
}

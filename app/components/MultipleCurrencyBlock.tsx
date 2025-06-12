'use client';
import React, { useEffect, useState } from 'react';
import { Detail } from '@/app/utils/types';
import Link from 'next/link';

export default function MarketCapList() {
  const [data, setData] = useState<Detail[]>([]);
  const Markets: string[] = [
    "BTCUSDT", "ETHUSDT", "SOLUSDT", "AAVEUSDT", "LINKUSDT",
    "UNIUSDT", "LDOUSDT", "APEUSDT"
  ];

  const backpackString = (symbol: string) => {
    return symbol.replace("USDT", "").toLocaleUpperCase() + "_USDC";
  };

  useEffect(() => {
    let ws: WebSocket;

    async function loadInitialDataAndConnectWS() {
      const initialData = Markets.map(symbol => ({
        symbol,
        currentPrice: 0,
        quotevolume: 0,
        percentagechange: 0,
        maxhigh: 0,
        maxlow: 0
      }));
      setData(initialData);

      const streams = initialData.map(x => `${x.symbol.toLowerCase()}@ticker`).join('/');
      const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const symbol = msg.data.s;
        const price = parseFloat(msg.data.c);
        const priceChangepercent = parseFloat(msg.data.P);
        const Maxhigh = parseFloat(msg.data.h);
        const Maxlow = parseFloat(msg.data.l);

        setData((prevData) =>
          prevData.map((item) =>
            item.symbol === symbol ? {
              ...item,
              currentPrice: price,
              percentagechange: priceChangepercent,
              maxhigh: Maxhigh,
              maxlow: Maxlow
            } : item
          )
        );
      };
    }

    loadInitialDataAndConnectWS();

    return () => {
      if (ws) {
        ws.close(1000, 'Component unmounted');
      }
    };
  },[]);

  return (
    <div className=" text-white min-h-screen flex flex-col justify-between">
        
        <div className="shadow-2xl  shadow-gray-300 rounded-2xl shadow-4xl overflow-hidden border border-gray-800">
          
          {/* Navbar/Header Row */}
          <div className="hidden sm:grid grid-cols-4 gap-6 px-12 pt-5 py-2 bg-transparent text-gray-400 font-semibold text-sm uppercase tracking-wider items-center">
            <div className="font-bold">Market</div>
            <div className="text-center font-bold">Price</div>
            <div className="font-bold text-center">24h High/Low</div>
            <div className=" font-bold text-end">Change</div>
          </div>

          {data.map((x) => (
            <div
              key={x.symbol}
              className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 px-12 py-4 border-b border-gray-800 bg-[] text-white items-center"
            >
              {/* Market */}
              <div className="justify-self-start">
                <Link href={`./${backpackString(x.symbol)}`}>
                  <p className="text-lg font-bold text-white">
                    {x.symbol.replace('USDT', '')}
                  </p>
                  <p className="text-sm text-gray-400">
                    {x.symbol.replace('USDT', '')}/USD
                  </p>
                </Link>
              </div>

              {/* Price */}
              <p className="text-xl font-bold text-white text-start sm:text-center">
                ${x.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>

              {/* High / Low */}
              <div className="text-start sm:text-center flex flex-col items-start sm:items-center">
                <p className="text-green-500 text-sm font-semibold">
                  High: ${x.maxhigh?.toFixed(2)}
                </p>
                <div className='h-2'></div>
                <p className="text-red-500 text-sm font-semibold">
                  Low: ${x.maxlow?.toFixed(2)}
                </p>
              </div>

              {/* Change */}
              <p
                className={`text-lg font-bold text-start sm:text-end ${
                  x.percentagechange >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {x.percentagechange.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      
    </div>

  );
}
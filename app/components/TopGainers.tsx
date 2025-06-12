"use client"
import React, { useEffect, useState } from 'react'
import { getTickers } from '../utils/httpClient'
import { Ticker } from '../utils/types';

export default function TopGainers() {
    const Gainers=[{"Market":"BTC","price":12.54,"P&L":"-3.2%"}]
    const [data, setData] = useState<Ticker[] | null>([]);
    
useEffect(() => {
  const fetchdata = async () => {
    const res = await getTickers();
    const copy = [...res];

    // Sort descending by priceChangePercent and take top 5
    const top5 = copy
      .sort((a, b) => Number(b.priceChangePercent) - Number(a.priceChangePercent))
      .slice(0, 5)
      // Modify symbol for each ticker
      .map((x) => {
        const underscoreIndex = x.symbol.indexOf('_');
        if (underscoreIndex !== -1) {
          return {
            ...x,
            symbol: x.symbol.substring(0, underscoreIndex),
          };
        }
        return x;
      });

    setData(top5);
  };
  fetchdata();
}, []);


  return (
    

            <div className='bg-[#14151B] w-107 h-68 pt-3 rounded-2xl'>
  <div className='underline font-bold text-2xl text-white ml-4'>Top Gainers</div>
  <div className='pt-4 space-y-2'>
    {data?.map((x) => {
      return (
        <div
          className='flex items-center justify-between mx-4 px-4 py-1 rounded hover:bg-gray-950'
          key={x.lastPrice}
        >
          <div className='text-white font-bold w-1/3 truncate '>{x.symbol}</div>
          <div className='text-white font-bold w-1/3 text-center'>
            {Number(x.lastPrice).toFixed(5)}
          </div>
          <div
              className={`font-bold w-1/3 text-right ${
                Number(x.priceChangePercent) >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {Number(x.priceChangePercent) >= 0 ? '+' : ''}
              {(Number(x.priceChangePercent) * 100).toFixed(2)}%
            </div>
        </div>
      );
    })}
  </div>
</div>

  )
}
//<div className='text-white font-bold'>{(Number(x.priceChangePercent)*100).toFixed(2)}</div>
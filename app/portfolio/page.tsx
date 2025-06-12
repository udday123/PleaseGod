'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getTicker } from '../utils/httpClient';

interface PortfolioHolding {
  id: string;
  market: string;
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  value?: number;
  pnl?: number;
  pnlPercentage?: number;
}

export default function Portfolio() {
  const { data: session, status } = useSession();
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!session?.user?.id) return;

      try {
        // Fetch all holdings
        const response = await fetch('/api/fetchUsersHoldings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ market: 'all' })
        });

        if (!response.ok) throw new Error('Failed to fetch holdings');

        const data = await response.json();
        
        // Fetch current prices for each holding
        const holdingsWithPrices = await Promise.all(
          data.holdings.map(async (holding: PortfolioHolding) => {
            try {
              const ticker = await getTicker(holding.market);
              const currentPrice = Number(ticker.lastPrice);
              const value = holding.quantity * currentPrice;
              const pnl = value - (holding.quantity * Number(holding.averagePrice));
              const pnlPercentage = (pnl / (holding.quantity * Number(holding.averagePrice))) * 100;

              return {
                ...holding,
                currentPrice,
                value,
                pnl,
                pnlPercentage
              };
            } catch (error) {
              console.error(`Error fetching price for ${holding.market}:`, error);
              return holding;
            }
          })
        );

        setHoldings(holdingsWithPrices);
        
        // Calculate totals
        const total = holdingsWithPrices.reduce((sum, h) => sum + (h.value || 0), 0);
        const totalPnlValue = holdingsWithPrices.reduce((sum, h) => sum + (h.pnl || 0), 0);
        
        setTotalValue(total);
        setTotalPnl(totalPnlValue);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, [session]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your portfolio</h1>
          <p className="text-gray-400">You need to be logged in to access your portfolio information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Portfolio Summary */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Portfolio Overview</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-gray-400 text-sm mb-2">Total Value</h2>
            <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-gray-400 text-sm mb-2">Total P&L</h2>
            <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${totalPnl.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-gray-400 text-sm mb-2">Total P&L %</h2>
            <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {((totalPnl / (totalValue - totalPnl)) * 100).toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Holdings Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Avg. Entry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    P&L
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    P&L %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {holdings.map((holding) => (
                  <tr key={`${holding.market}-${holding.quantity}`} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{holding.market}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{holding.quantity.toFixed(4)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">${Number(holding.averagePrice).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">${holding.currentPrice?.toFixed(2) || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">${holding.value?.toFixed(2) || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${holding.pnl && holding.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${holding.pnl?.toFixed(2) || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${holding.pnlPercentage && holding.pnlPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {holding.pnlPercentage?.toFixed(2) || 'N/A'}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

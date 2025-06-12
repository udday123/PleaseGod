import { useState } from "react";

export default function BidTable({ bids }: { bids: [string, string][] }) {
  // Clone and process bids
  let sortedBids = [...bids];
  let runningQuantity = 0;

  // Convert bid data to numerical format and calculate cumulative quantities
  let bidsInNumberFormat = sortedBids.map(([price, quantity]) => {
    const numQuantity = Number(quantity);
    runningQuantity += numQuantity;
    return [Number(price), numQuantity, runningQuantity] as [number, number, number];
  });

  // Limit to top 30 bids
  bidsInNumberFormat = bidsInNumberFormat.slice(0, 30);

  // Calculate total cumulative quantity
  const totalCumulative = bidsInNumberFormat[bidsInNumberFormat.length - 1]?.[2] || 1;

  return (
    <div className="text-sm font-mono">
      {bidsInNumberFormat.map(([price, quantity, cumulative], index) => {
        // Calculate cumulative percentage
        const percentage = (cumulative / totalCumulative) * 100;

        return (
          <div key={index}>
          <div
            key={index}
            className="relative flex w-68 gap-6 h-6 items-center"
          >
            {/* Background bar with smooth transition */}
            <div
              className="absolute left-0 top-0 h-full bg-emerald-600 opacity-20 transition-all duration-500 ease-in-out"
              style={{ width: `${percentage}%` }}
            />

            {/* Bid information */}
            <div className="w-16 text-right text-emerald-500 z-10">
              {price.toFixed(2)}
            </div>
            <div className="w-16 text-right text-white z-10">
              {quantity.toFixed(5)}
            </div>
            <div className="w-16 text-right text-yellow-400 z-10">
              {cumulative.toFixed(5)}
            </div>
          </div>
          <div className="h-0.5"></div>
          </div>
        );
      })}
    </div>
  );
}

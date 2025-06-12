import { useEffect, useState, useRef } from "react"
import { Depth } from "../utils/types"
import { SinglingManager } from "../utils/SignilingManager";
import { getDepth } from "../utils/httpClient";
import AskTable from "./AskBook";
import BidTable from "./BidBook";
import { SingleTicker } from "react-ts-tradingview-widgets";
export default function OrderBook({ market }: { market: string }) {

  const [bids, setbids] = useState<Depth["bids"]>([]);
  const [asks, setasks] = useState<Depth["asks"]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollReady, setScrollReady] = useState(false); // 👈 add this
  useEffect(() => {
    getDepth(market).then((x) => {
      setbids(x.bids);
      setasks(x.asks);
      setScrollReady(true); // 👈 trigger scroll when data is ready
    });



    SinglingManager.getInstance().registerCallback(
      "depth",
      (realtimebids: [string, string][], realtimeasks: [string, string][]) => {

        setbids((prev) => {
          const updated = [...prev];

          // Update existing bids
          for (let i = 0; i < updated.length; i++) {
            for (let j = 0; j < realtimebids.length; j++) {
              const [prevPrice, _] = updated[i];
              const [realPrice, realQty] = realtimebids[j];
              if (prevPrice === realPrice) {
                if (Number(realQty) === 0) {
                  updated.splice(i, 1);
                  i--; // adjust after removal
                } else {
                  updated[i][1] = realQty;
                }
                break;
              }
            }
          }

          // Add new bids that don’t exist
          for (let j = 0; j < realtimebids.length; j++) {
            const [realPrice, realQty] = realtimebids[j];
            const exists = updated.some(([p]) => p === realPrice);
            if (!exists && Number(realQty) !== 0) {
              updated.push([realPrice, realQty]);
            }
          }

          return updated.sort((a, b) => Number(b[0]) - Number(a[0])); // High to low
        });

        // ASKS update using O(n²) approach
        setasks((prev) => {
          const updated = [...prev];

          for (let i = 0; i < updated.length; i++) {
            for (let j = 0; j < realtimeasks.length; j++) {
              const [prevPrice, _] = updated[i];
              const [realPrice, realQty] = realtimeasks[j];

              if (prevPrice === realPrice) {
                if (Number(realQty) === 0) {
                  updated.splice(i, 1);
                  i--;
                } else {
                  updated[i][1] = realQty;
                }
                break;
              }
            }
          }

          for (let j = 0; j < realtimeasks.length; j++) {
            const [realPrice, realQty] = realtimeasks[j];
            const exists = updated.some(([p]) => p === realPrice);
            if (!exists && Number(realQty) !== 0) {
              updated.push([realPrice, realQty]);
            }
          }

          return updated.sort((a, b) => Number(a[0]) - Number(b[0])); // Low to high
        });
      },
      `Depth-${market}`
    );

    SinglingManager.getInstance().sendMessage({
      method: "SUBSCRIBE",
      params: [`depth.1000ms.${market}`],
    });

    return () => {
      SinglingManager.getInstance().deRegisterCallback("depth", `Depth-${market}`);
      SinglingManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`depth.1000ms.${market}`],
      });
    };
  }, [market]);

  useEffect(() => {
    if (scrollReady && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight / 3.5;
      setScrollReady(false); // reset flag
    }
  }, [scrollReady]);
  return (
    <div className="h-full">
      <div ref={scrollRef}
  className="rounded-lg h-full overflow-auto no-scrollbar"
>
        <AskTable asks={asks} />
{asks.length > 0 && bids.length > 0 ? (
  <div className="relative rounded-lg p-[1px] overflow-hidden animate-border-thin">
    <div className="flex items-center gap-2 text-sm text-gray-300 bg-zinc-900 px-6 py-1 rounded-lg shadow-md">
      <span className="uppercase text-xs text-gray-400">Avg. Price</span>
      <span className="text-amber-300 text-lg font-semibold tracking-wide">
        ${((Number(asks[0][0]) + Number(bids[0][0])) / 2).toFixed(2)}
      </span>
    </div>
  </div>
) : (
  <div className="text-gray-400 text-sm italic">Loading price...</div>
)}

        <BidTable bids={bids} />
      </div>
    </div>
  );
}
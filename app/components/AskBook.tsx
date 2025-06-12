export default function AskTable({ asks }: { asks: [string, string][] }) {
  // Clone asks and prepare running cumulative quantity
  let sortedAsks = [...asks];
  let runningQuantity = 0;

  // Convert to number and calculate cumulative quantities
  let asksInNumberFormat = sortedAsks.map(([price, quantity]) => {
    const numQty = Number(quantity);
    runningQuantity += numQty;
    return [Number(price), numQty, runningQuantity] as [number, number, number];
  });

  // Limit to top 30 asks
  asksInNumberFormat = asksInNumberFormat.slice(0, 30);
  
  // Calculate total cumulative quantity BEFORE reversing (matches BidTable logic)
  const totalCumulative = asksInNumberFormat[asksInNumberFormat.length - 1]?.[2] || 1;
  
  // Now reverse for display
  asksInNumberFormat = asksInNumberFormat.reverse();

  return (
    <div className="text-sm font-mono">
      {asksInNumberFormat.map(([price, quantity, cumulative], index) => {
        // Calculate cumulative percentage of total quantity
        const percentage = (cumulative / totalCumulative) * 100;

        return (
          <div key={index}>
          <div
            key={index}
            className="relative flex w-68 gap-6 h-6 items-center"
          >
            {/* Animated red background bar */}
            <div
              className="absolute left-0 top-0 h-full bg-red-600 opacity-20 transition-all duration-500 ease-in-out"
              style={{ width: `${percentage}%` }}
            />

            <div className="w-16 text-right text-red-400 z-10">
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
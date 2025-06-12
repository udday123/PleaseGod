import { useState, useEffect, useMemo } from "react"; // Import useMemo
import { DollarSign } from "lucide-react";
import { getTicker } from "../utils/httpClient";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FaSpinner } from "react-icons/fa";
import Swal from 'sweetalert2'; // Import SweetAlert2

export default function TradeSection({ market }: { market: string }) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isAuthLoading = status === "loading";

  const [orderType, setOrderType] = useState<"Limit" | "Market">("Limit");
  const [price, setPrice] = useState("0");
  const [quantity, setQuantity] = useState("0");
  const [postOnly, setPostOnly] = useState(false);
  const [ioc, setIOC] = useState(true);
  const [priceType, setPriceType] = useState<"Mid" | "BBO">("Mid");
  const [lastPricePlaceholder, setLastPricePlaceholder] = useState("");
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const [holdings, setHoldings] = useState(0);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [tradeSide, setTradeSide] = useState<"BUY" | "SELL">("BUY"); // Moved here for better scope

  // Function to fetch and update balance and holdings
  const fetchBalanceAndHoldings = async () => {
    if (!isAuthenticated || !session?.user?.id) {
      console.log('User not authenticated or missing ID');
      setUserBalance(0);
      setHoldings(0);
      return;
    }

    try {
      const res = await fetch("/api/fetchUsersBalance");
      const data = await res.json();
      
      if (!res.ok) {
        console.error("Balance fetch error:", data.error, data.details);
        throw new Error(data.error || "Failed to fetch balance");
      }
      
      setUserBalance(data.balance);
    } catch (err) {
      console.error("Error fetching balance:", err);
      setUserBalance(0); // fallback
    }

    try {
      const res = await fetch("/api/fetchUsersHoldings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market })
      });
      const dataHoldings = await res.json();
      
      if (!res.ok) {
        console.error("Holdings fetch error:", dataHoldings.error);
        throw new Error(dataHoldings.error || "Failed to fetch Holdings");
      }
      
      setHoldings(Number(dataHoldings.totalQuantity));
    } catch (err) {
      console.error("Error fetching Holdings:", err);
      setHoldings(0); // fallback
    }
  };

  // Initial fetch of balance and holdings on authentication or market change
  useEffect(() => {
    fetchBalanceAndHoldings();
  }, [isAuthenticated, market]); // Add market to dependency array as it's used in fetchUsersHoldings

  // Fetch last price for placeholder and initial price
  useEffect(() => {
    getTicker(market).then((x) => {
      setLastPricePlaceholder(x.lastPrice);
      // Only set price to lastPrice if it's currently 0 or unchanged
      // This prevents overwriting user's manual input if they change price
      if (price === "0" || price === lastPricePlaceholder) {
         setPrice(x.lastPrice);
      }
    });
  }, [market]); // Depend on market to refetch for new market

  // Logic to handle Post Only / IOC exclusivity
  const handleIOCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIOC(isChecked);
    if (isChecked) {
      setPostOnly(false); // If IOC is checked, uncheck Post Only
    }
  };

  // When order type changes, reset Post Only and IOC if they become invalid
  useEffect(() => {
    if (orderType !== "Limit") {
      setPostOnly(false);
      setIOC(false);
    }
  }, [orderType]);

  const calculateOrderValue = () => {
    const p = parseFloat(price) || 0;
    const q = parseFloat(quantity) || 0;
    return (p * q).toFixed(2);
  };

  // Calculate max quantity for slider based on trade side and available funds/holdings
  const maxQuantityForSlider = useMemo(() => {
    const currentPriceNum = parseFloat(price);
    if (tradeSide === "BUY") {
      // For buying, max quantity is limited by user's balance and current price
      return currentPriceNum > 0 ? (userBalance / currentPriceNum) : 0;
    } else {
      // For selling, max quantity is limited by user's holdings
      return holdings;
    }
  }, [tradeSide, userBalance, holdings, price]);

  const handleQuantitySlider = (value: string) => {
    const numValue = parseFloat(value);
    // Ensure quantity doesn't exceed the calculated max for the slider
    setQuantity(Math.min(numValue, maxQuantityForSlider).toString());
  };

  const executeTrade = async (chosenTradeType: "BUY" | "SELL") => {
    setIsExecutingTrade(true);

    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseFloat(quantity);
    const orderValue = parsedPrice * parsedQuantity;

    // Input validation checks
    if (isNaN(parsedPrice) || parsedPrice <= 0 || isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Input Error',
        text: 'Please enter valid price and quantity for your order.',
        confirmButtonText: 'Understood',
        confirmButtonColor: '#dc3545',
        customClass: {
          container: 'swal-container', popup: 'swal-popup', title: 'swal-title',
          htmlContainer: 'swal-text', confirmButton: 'swal-button',
        }
      });
      setIsExecutingTrade(false);
      return;
    }

    // Balance check for buy orders
    if (chosenTradeType === "BUY" && orderValue > userBalance) {
      Swal.fire({
        icon: 'warning',
        title: 'Insufficient Balance',
        text: 'Your order value exceeds your available balance. Please adjust the quantity or price.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107',
        customClass: {
          container: 'swal-container', popup: 'swal-popup', title: 'swal-title',
          htmlContainer: 'swal-text', confirmButton: 'swal-button',
        }
      });
      setIsExecutingTrade(false);
      return;
    }

    // Holdings check for sell orders
    if (chosenTradeType === "SELL" && parsedQuantity > holdings) {
      Swal.fire({
        icon: 'warning',
        title: 'Insufficient Holdings',
        text: `You only hold ${holdings.toFixed(4)} units of ${market.split('/')[0]}. Please adjust the quantity.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107',
        customClass: {
          container: 'swal-container', popup: 'swal-popup', title: 'swal-title',
          htmlContainer: 'swal-text', confirmButton: 'swal-button',
        }
      });
      setIsExecutingTrade(false);
      return;
    }

    try {
      console.log('Executing trade:', {
        market,
        orderType,
        price: parsedPrice,
        quantity: parsedQuantity,
        tradeType: chosenTradeType
      });

      const response = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          market,
          orderType,
          price: parsedPrice,
          quantity: parsedQuantity,
          postOnly,
          ioc,
          priceType,
          tradeType: chosenTradeType,
        }),
      });

      const data = await response.json();
      console.log('Trade response:', data);

      if (response.ok) {
        // Show success message with trade details
        await Swal.fire({
          icon: 'success',
          title: 'Trade Executed Successfully!',
          html: `
            <div class="text-left">
              <p class="mb-2"><strong>Order Details:</strong></p>
              <ul class="list-disc pl-5">
                <li>Type: ${chosenTradeType}</li>
                <li>Market: ${market}</li>
                <li>Quantity: ${parsedQuantity}</li>
                <li>Price: $${parsedPrice.toFixed(2)}</li>
                <li>Total Value: $${orderValue.toFixed(2)}</li>
              </ul>
              <p class="mt-4"><strong>Execution Details:</strong></p>
              <ul class="list-disc pl-5">
                <li>Average Price: $${data.order?.averagePrice?.toFixed(2) || 'N/A'}</li>
                <li>Filled: ${data.order?.filledQuantity || '0'}</li>
                <li>Unfilled: ${data.order?.unfilledQuantity || '0'}</li>
                <li>Status: ${data.order?.status || 'Unknown'}</li>
              </ul>
            </div>
          `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745',
          customClass: {
            container: 'swal-container',
            popup: 'swal-popup',
            title: 'swal-title',
            htmlContainer: 'swal-text',
            confirmButton: 'swal-button',
          }
        });

        // Reset form
        setQuantity("0");
        if (orderType !== "Market") {
          setPrice("0");
        }

        // Force refresh balance and holdings
        await fetchBalanceAndHoldings();

        // Show toast notification for portfolio update
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'Updating portfolio...',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });

      } else {
        // Show error message
        Swal.fire({
          icon: 'error',
          title: 'Trade Failed',
          text: data.error || 'Failed to execute trade. Please try again.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545',
          customClass: {
            container: 'swal-container',
            popup: 'swal-popup',
            title: 'swal-title',
            htmlContainer: 'swal-text',
            confirmButton: 'swal-button',
          }
        });
      }
    } catch (error) {
      console.error('Trade execution error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Trade Failed',
        text: 'An error occurred while executing the trade. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545',
        customClass: {
          container: 'swal-container',
          popup: 'swal-popup',
          title: 'swal-title',
          htmlContainer: 'swal-text',
          confirmButton: 'swal-button',
        }
      });
    } finally {
      setIsExecutingTrade(false);
    }
  };

  const isDisabled = !isAuthenticated || isExecutingTrade;

  // Determine if Post Only/IOC checkboxes should be disabled
  const isPostOnlyOrIOCDisabled = isDisabled || orderType !== "Limit";

  // Extract base and quote assets for display
  const [baseAsset, quoteAsset] = market.split('_');

  return (
    <div
      className="text-white p-4 max-w-lg mx-auto rounded-lg sm:max-w-md sm:p-3 xs:max-w-full xs:p-2 xs:px-4"
      style={{ backgroundColor: "#0f0f0f" }}
    >
      {/* Buy/Sell Tabs */}
      <div className="grid grid-cols-2 mb-4 gap-2 xs:grid-cols-1 xs:gap-1">
        <button
          className={`cursor-pointer border-b-2 h-10 text-center font-semibold text-lg rounded-lg w-full ${
            tradeSide === "BUY"
              ? "border-emerald-600 hover:bg-black hover:border-b-emerald-500 text-emerald-600"
              : "border-transparent hover:text-emerald-600 hover:bg-black"
          }`}
          disabled={isDisabled}
          onClick={() => setTradeSide("BUY")}
        >
          Buy
        </button>
        <button
          className={`cursor-pointer border-b-2 h-10 text-center font-semibold text-lg rounded-lg w-full ${
            tradeSide === "SELL"
              ? "border-red-500 hover:bg-black hover:border-b-red-500 text-red-500"
              : "border-transparent hover:text-red-500 hover:bg-black"
          }`}
          disabled={isDisabled}
          onClick={() => setTradeSide("SELL")}
        >
          Sell
        </button>
      </div>

      {/* Order Type Tabs */}
      <div
        className={`flex bg-gray-800 rounded-lg p-1 mb-4 flex-wrap xs:gap-1 ${
          isDisabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {["Limit", "Market"].map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type as "Limit" | "Market")}
            className={`flex-1 min-w-[90px] py-1.5 px-2 text-sm rounded-lg transition-colors ${
              orderType === type
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-white"
            } ${isDisabled ? "pointer-events-none" : ""}`}
            disabled={isDisabled}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Balance */}
      <div className="flex justify-between items-center mb-2 text-sm xs:text-xs">
        <span className="text-blue-400">Balance({quoteAsset})</span> {/* Display quote asset */}
        <span className="text-gray-400">{isAuthenticated ? userBalance.toFixed(2) : "-"}</span>
      </div>

      {/* Holdings */}
      <div className="flex justify-between items-center mb-2 text-sm xs:text-xs">
        <span className="text-purple-400">Holdings ({baseAsset})</span> {/* Display base asset */}
        <span className="text-gray-400">{isAuthenticated ? holdings.toFixed(5) : "-"}</span>
      </div>

      {/* Price Section */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1 text-sm xs:text-xs">
          <span className="text-gray-400">Price</span>
          <div className={`flex gap-1 xs:gap-0.5 ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}>
            <button
              onClick={() => setPriceType("Mid")}
              className={`px-2 py-0.5 text-xs rounded ${
                priceType === "Mid" ? "bg-blue-600 text-white" : "text-blue-400"
              } ${isDisabled ? "pointer-events-none" : ""}`}
              disabled={isDisabled}
            >
              Mid
            </button>
            <button
              onClick={() => setPriceType("BBO")}
              className={`px-2 py-0.5 text-xs rounded ${
                priceType === "BBO" ? "bg-blue-600 text-white" : "text-blue-400"
              } ${isDisabled ? "pointer-events-none" : ""}`}
              disabled={isDisabled}
            >
              BBO
            </button>
          </div>
        </div>
        <div className="relative">
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white pr-10 focus:outline-none focus:border-blue-500 text-sm xs:text-xs ${
              isDisabled || orderType === "Market" ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder={lastPricePlaceholder || "0"}
            disabled={isDisabled || orderType === "Market"}
          />
          <DollarSign className="absolute right-3 top-2.5 w-4 h-4 text-green-500" />
        </div>
      </div>

      {/* Quantity Section */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1 text-sm xs:text-xs">
          <span className="text-gray-400">Quantity</span>
        </div>
        <div className="relative mb-2">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white pr-10 focus:outline-none focus:border-blue-500 text-sm xs:text-xs ${
              isDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder="0"
            disabled={isDisabled}
          />
          <div className="absolute right-3 top-2.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white">
            {baseAsset.charAt(0)} {/* Display first letter of base asset */}
          </div>
        </div>

        {/* Quantity Slider */}
        <div className="relative">
          <input
            type="range"
            min="0"
            // Set max dynamically based on trade side and available funds/holdings
            max={maxQuantityForSlider.toFixed(8)} // Use toFixed to prevent scientific notation if number is too small
            step="any" // Allow non-integer steps
            value={parseFloat(quantity) || 0}
            onChange={(e) => handleQuantitySlider(e.target.value)}
            className={`w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer slider ${
              isDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isDisabled}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>0</span>
            {/* Display relevant max for slider */}
            <span>
              {maxQuantityForSlider.toFixed(4)} {baseAsset} (
              {tradeSide === "SELL"
                ? `${((parseFloat(quantity) || 0) / holdings * 100).toFixed(0)}%`
                : `${((parseFloat(quantity) || 0) / maxQuantityForSlider * 100).toFixed(0)}%`}
              )
            </span>
          </div>
        </div>
      </div>

      {/* Order Value */}
      <div className="mb-3">
        <div className="text-gray-400 text-sm mb-1 xs:text-xs">Order Value ({quoteAsset})</div>
        <div className="relative">
          <input
            type="text"
            value={calculateOrderValue()}
            readOnly
            className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white pr-10 focus:outline-none text-sm xs:text-xs ${
              isDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isDisabled}
          />
          <DollarSign className="absolute right-3 top-2.5 w-4 h-4 text-green-500" />
        </div>
      </div>

      {/* --- Action Buttons --- */}
      <div className="space-y-2 mb-3">
        {isAuthLoading ? (
          <button
            className="w-full bg-gray-700 text-white py-2 rounded-lg font-medium flex items-center justify-center opacity-70 cursor-not-allowed"
            disabled
          >
            <FaSpinner className="animate-spin mr-2" /> Loading...
          </button>
        ) : isAuthenticated ? (
          <>
            <button
              onClick={() => executeTrade("BUY")}
              className={`w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors text-sm xs:text-xs flex items-center justify-center ${
                isExecutingTrade ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={isExecutingTrade}
            >
              {isExecutingTrade ? <FaSpinner className="animate-spin mr-2" /> : ""}
              Buy {baseAsset}
            </button>
            <button
              onClick={() => executeTrade("SELL")}
              className={`w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm xs:text-xs flex items-center justify-center ${
                isExecutingTrade ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={isExecutingTrade}
            >
              {isExecutingTrade ? <FaSpinner className="animate-spin mr-2" /> : ""}
              Sell {baseAsset}
            </button>
          </>
        ) : (
          <>
            <Link href="/signup" passHref>
              <button className="w-full bg-white text-black py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm xs:text-xs">
                Sign up to trade
              </button>
            </Link>
            <Link href="/signin" passHref>
              <button className="w-full bg-gray-800 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700 text-sm xs:text-xs">
                Sign in to trade
              </button>
            </Link>
          </>
        )}
      </div>

      {/* Checkboxes */}
      <div
        className={`flex gap-3 xs:flex-col xs:gap-1 ${
          isDisabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <label className={`flex items-center gap-1.5 text-sm text-gray-400 xs:text-xs ${isPostOnlyOrIOCDisabled ? "opacity-50 cursor-not-allowed" : ""}`}>
          <input
            type="checkbox"
            checked={ioc}
            onChange={handleIOCChange}
            className="w-4 h-4 bg-gray-800 border border-gray-600 rounded"
            disabled={isPostOnlyOrIOCDisabled}
          />
          IOC
        </label>
      </div>
    </div>
  );
}
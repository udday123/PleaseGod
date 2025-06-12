import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";

// Define interfaces for your order and position data
interface Order {
  orderId: string;
  market: string;
  side: 'BUY' | 'SELL';
  orderType: string;
  price?: number;
  quantity?: number;
  filledQuantity?: number;
  unfilledQuantity?: number;
  averagePrice?: number;
  status: 'Open' | 'Filled' | 'Partially Filled' | 'Canceled';
  timestamp: string;
}

interface Position {
  id: string;
  market: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  roe: number;
  openTime: string;
  closeTime: string;
}

// Then, update your state variable types to use these interfaces
export const HistorySection = () => {
  const [activeTab, setActiveTab] = useState('openOrders');
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [filledOrders, setFilledOrders] = useState<Order[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [positionHistory, setPositionHistory] = useState<Position[]>([]); // Placeholder for future use

  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isSessionLoading = status === "loading";

  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (isSessionLoading) {
        return; // Wait for session to load
      }
      if (!isAuthenticated || !session?.user?.id) {
        // Clear data if not authenticated
        setIsLoadingData(false);
        setOpenOrders([]);
        setFilledOrders([]);
        setOrderHistory([]);
        setPositionHistory([]);
        return;
      }

      setIsLoadingData(true);
      try {
        const userId = session.user.id;
        console.log('Fetching orders for user:', userId);

        const [openOrdersRes, filledOrdersRes, allOrdersRes] = await Promise.all([
          fetch(`/api/orders?status=Open&userId=${userId}`),
          fetch(`/api/orders?status=Filled&userId=${userId}`),
          fetch(`/api/orders?userId=${userId}`) // Fetch all for order history
        ]);

        if (openOrdersRes.ok) {
          const data = await openOrdersRes.json();
          console.log('Open orders data:', data);
          setOpenOrders(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch open orders:', await openOrdersRes.text());
          setOpenOrders([]);
        }

        if (filledOrdersRes.ok) {
          const data = await filledOrdersRes.json();
          console.log('Filled orders data:', data);
          setFilledOrders(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch filled orders:', await filledOrdersRes.text());
          setFilledOrders([]);
        }

        if (allOrdersRes.ok) {
          const data = await allOrdersRes.json();
          console.log('All orders data:', data);
          setOrderHistory(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch all order history:', await allOrdersRes.text());
          setOrderHistory([]);
        }

      } catch (error) {
        console.error('Error fetching order data:', error);
        setOpenOrders([]);
        setFilledOrders([]);
        setOrderHistory([]);
        setPositionHistory([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, isSessionLoading, session?.user?.id]);

  if (isSessionLoading) {
    return (
      <div className='flex justify-center items-center h-48 bg-[#202127] ml-3 rounded-lg text-white'>
        <FaSpinner className="animate-spin text-blue-500 text-3xl" />
        <p className='ml-2'>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className='mt-2 p-4 bg-[#202127] h-100 ml-3 w-306 rounded-lg text-white text-center'>
        <h3 className='text-lg font-semibold mb-2'>Access Denied</h3>
        <p className='text-stone-400'>Please sign in to view your order history.</p>
        <button
          onClick={() => signIn()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className='mt-2'>
      <div className='pl-7 pt-5 bg-[#202127] h-100 ml-3 space-x-46 w-306 rounded-lg'>
        {/* Tab Buttons */}
        <button
          className={`cursor-pointer ${activeTab === 'openOrders' ? 'text-white border-b-2 border-blue-500' : 'text-stone-300 hover:text-stone-400'}`}
          onClick={() => setActiveTab('openOrders')}
        >
          Open Orders
        </button>
        <button
          className={`cursor-pointer ${activeTab === 'fillOrders' ? 'text-white border-b-2 border-blue-500' : 'text-stone-300 hover:text-stone-400'}`}
          onClick={() => setActiveTab('fillOrders')}
        >
          Filled Orders
        </button>
        <button
          className={`cursor-pointer ${activeTab === 'orderHistory' ? 'text-white border-b-2 border-blue-500' : 'text-stone-300 hover:text-stone-400'}`}
          onClick={() => setActiveTab('orderHistory')}
        >
          Order History
        </button>
        <button
          className={`cursor-pointer ${activeTab === 'positionHistory' ? 'text-white border-b-2 border-blue-500' : 'text-stone-300 hover:text-stone-400'}`}
          onClick={() => setActiveTab('positionHistory')}
        >
          Position History
        </button>

        {/* Content Area */}
        <div className='mt-4 p-4 mr-6 bg-[#272933] rounded-2xl h-80 overflow-auto'>
          {isLoadingData ? (
            <div className='flex justify-center items-center h-24'>
              <FaSpinner className="animate-spin text-blue-500 text-2xl" />
              <p className='text-white ml-2'>Loading orders...</p>
            </div>
          ) : (
            <>
              {/* Open Orders Tab Content */}
              {activeTab === 'openOrders' && (
                <div>
                  <h3 className='text-white text-lg font-semibold mb-2'>Your Open Orders</h3>
                  {openOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Market</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Side</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Qty</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Filled</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unfilled</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Price</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-900 divide-y divide-gray-700">
                          {openOrders.map((order) => (
                            <tr key={order.orderId} className="hover:bg-gray-800">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                {order.market}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${order.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>
                                {order.side}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.orderType}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.price ? `$${order.price.toFixed(2)}` : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.quantity ? order.quantity.toFixed(8) : '0'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.filledQuantity ? order.filledQuantity.toFixed(8) : '0'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.unfilledQuantity ? order.unfilledQuantity.toFixed(8) : '0'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.averagePrice ? `$${order.averagePrice.toFixed(2)}` : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  order.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'Partially Filled' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {new Date(order.timestamp).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className='text-stone-400'>No open orders at the moment.</p>
                  )}
                </div>
              )}

              {/* Fill Orders Tab Content */}
              {activeTab === 'fillOrders' && (
                <div>
                  <h3 className='text-white text-lg font-semibold mb-2'>Your Filled Orders</h3>
                  {filledOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Market</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Side</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Qty</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Filled</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unfilled</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Price</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-900 divide-y divide-gray-700">
                          {filledOrders.map((order) => (
                            <tr key={order.orderId} className="hover:bg-gray-800">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                {order.market}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${order.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>
                                {order.side}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.orderType}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.price ? `$${order.price.toFixed(2)}` : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.quantity ? order.quantity.toFixed(8) : '0'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.filledQuantity ? order.filledQuantity.toFixed(8) : '0'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.unfilledQuantity ? order.unfilledQuantity.toFixed(8) : '0'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.averagePrice ? `$${order.averagePrice.toFixed(2)}` : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  order.status === 'Filled' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {new Date(order.timestamp).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className='text-stone-400'>No recent filled orders.</p>
                  )}
                </div>
              )}

              {/* Order History Tab Content */}
              {activeTab === 'orderHistory' && (
                <div>
                  <h3 className='text-white text-lg font-semibold mb-2'>Your Order History</h3>
                  {orderHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Market</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Side</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Qty</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Filled</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unfilled</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Price</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-900 divide-y divide-gray-700">
                          {orderHistory.map((order) => (
                            <tr key={order.orderId} className="hover:bg-gray-800">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                {order.market}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${order.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>
                                {order.side}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.orderType}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.price ? `$${order.price.toFixed(2)}` : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.quantity ? order.quantity.toFixed(8) : '0'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.filledQuantity ? order.filledQuantity.toFixed(8) : '0'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.unfilledQuantity ? order.unfilledQuantity.toFixed(8) : '0'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.averagePrice ? `$${order.averagePrice.toFixed(2)}` : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  order.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'Filled' ? 'bg-green-100 text-green-800' :
                                  order.status === 'Partially Filled' ? 'bg-yellow-100 text-yellow-800' :
                                  order.status === 'Canceled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {new Date(order.timestamp).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className='text-stone-400'>Your complete order history will appear here.</p>
                  )}
                </div>
              )}

              {/* Position History Tab Content */}
              {activeTab === 'positionHistory' && (
                <div>
                  <h3 className='text-white text-lg font-semibold mb-2'>Your Position History</h3>
                  {positionHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Market</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Side</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Entry Price</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Exit Price</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Size</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">P&L</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ROE</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Open Time</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Close Time</th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-900 divide-y divide-gray-700">
                          {positionHistory.map((position) => (
                            <tr key={position.id} className="hover:bg-gray-800">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                {position.market}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${position.side === 'LONG' ? 'text-emerald-500' : 'text-red-500'}`}>
                                {position.side}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                ${position.entryPrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                ${position.exitPrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {position.size.toFixed(8)}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${position.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                ${position.pnl.toFixed(2)}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${position.roe >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {position.roe.toFixed(2)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {new Date(position.openTime).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {new Date(position.closeTime).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className='text-stone-400'>No position history available.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
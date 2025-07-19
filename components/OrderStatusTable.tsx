import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  orderType: string;
  qty: number;
  filledQty: number;
  avgFillPrice: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  submittedAt: string;
  filledAt?: string;
  timeInForce: string;
  fillPercentage: number;
}

const OrderStatusTable: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    
    // Auto-refresh every 10 seconds for live updates
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/alpaca/orders');
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch orders');
      }
    } catch (err) {
      setError('Network error fetching orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'accepted': 'bg-yellow-500 text-white',
      'pending_new': 'bg-blue-500 text-white', 
      'new': 'bg-blue-500 text-white',
      'partially_filled': 'bg-orange-500 text-white',
      'filled': 'bg-green-500 text-white',
      'canceled': 'bg-gray-500 text-white',
      'expired': 'bg-red-500 text-white',
      'rejected': 'bg-red-600 text-white'
    };
    
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-400 text-white';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPrice = (price: number | null) => {
    return price ? `$${price.toFixed(2)}` : '-';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
        <div className="text-red-600 bg-red-50 p-4 rounded-lg">
          <p>{error}</p>
          <button 
            onClick={fetchOrders}
            className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
        <button 
          onClick={fetchOrders}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No orders found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Asset</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Order Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Side</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Qty</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Filled Qty</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Avg Fill Price</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{order.symbol}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 capitalize">
                    {order.orderType}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      order.side === 'buy' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {order.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    {order.qty.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    {order.filledQty.toFixed(2)}
                    {order.fillPercentage > 0 && order.fillPercentage < 100 && (
                      <div className="text-xs text-gray-500">
                        ({order.fillPercentage.toFixed(1)}%)
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    {formatPrice(order.avgFillPrice)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={`${getStatusBadge(order.status)} text-xs`}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <div>{formatTime(order.submittedAt)}</div>
                    {order.filledAt && (
                      <div className="text-xs text-gray-500">
                        Filled: {formatTime(order.filledAt)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>Showing {orders.length} orders • Auto-refreshes every 10 seconds</p>
      </div>
    </div>
  );
};

export default OrderStatusTable;
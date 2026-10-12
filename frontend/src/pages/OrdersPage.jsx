import React, { useState, useEffect } from 'react';
import { PackageCheck, ArrowRight, Truck, ExternalLink, RefreshCw } from 'lucide-react';
import { apiGetOrders } from '../api';
import OrderTrackingModal from '../components/OrderTrackingModal';

export default function OrdersPage({ onTrackOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Failed to load order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Shipped':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Processing':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <PackageCheck className="w-6 h-6 text-indigo-600" />
            <span>My Orders & Shipments</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review past purchases, monitor delivery statuses, and track packages in real time.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-slate-200 transition-colors"
          title="Refresh orders"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 text-rose-700 rounded-2xl text-xs text-center border border-rose-100">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8">
          <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No orders placed yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Browse our catalog, add items to your cart, and experience seamless tracking upon checkout.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">
                      #{order.order_number}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 block">
                    Placed on {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Total Amount</span>
                    <span className="text-base font-bold text-slate-900">
                      ${Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedOrderId(order.id)}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Track Package</span>
                  </button>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 overflow-x-auto py-1">
                  {order.items && order.items.map((item) => (
                    <div
                      key={item.id}
                      className="relative shrink-0 w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-50"
                      title={`${item.product_name} (x${item.quantity})`}
                    >
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                          Item
                        </div>
                      )}
                      {item.quantity > 1 && (
                        <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[9px] font-bold px-1 rounded-tl">
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-xs text-slate-500 font-medium pl-3">
                  <span>Tracking: </span>
                  <span className="font-mono font-semibold text-slate-700">{order.tracking_number}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Order Tracking Modal */}
      {selectedOrderId && (
        <OrderTrackingModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusChange={fetchOrders}
        />
      )}

    </div>
  );
}

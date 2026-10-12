import React, { useState, useEffect } from 'react';
import { X, PackageCheck, Truck, CheckCircle2, Clock, AlertCircle, MapPin, Ban } from 'lucide-react';
import { apiGetOrder, apiCancelOrder } from '../api';

export default function OrderTrackingModal({ orderId, onClose, onStatusChange }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    apiGetOrder(orderId)
      .then(data => {
        setOrder(data);
      })
      .catch(err => {
        setError(err.message || 'Failed to load order tracking details.');
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? Products will be returned to stock.')) return;
    try {
      setCancelling(true);
      await apiCancelOrder(order.id);
      const updated = await apiGetOrder(order.id);
      setOrder(updated);
      if (onStatusChange) onStatusChange();
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (!orderId) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-slate-900">
                Order Tracking
              </span>
              {order && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}>
                  {order.status}
                </span>
              )}
            </div>
            {order && (
              <p className="text-xs text-slate-500 mt-1">
                Order #{order.order_number} • Placed on {new Date(order.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Fetching real-time tracking status...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-600 text-sm">
            {error}
          </div>
        ) : order ? (
          <div className="mt-6 space-y-6">
            
            {/* Courier & Tracking Card */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-indigo-950/20">
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-indigo-300 uppercase block">Tracking Reference</span>
                <span className="text-xl font-mono font-bold tracking-tight">{order.tracking_number}</span>
                <div className="flex items-center space-x-2 mt-1 text-xs text-slate-300">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Carrier: {order.carrier || 'Express Logistics'}</span>
                </div>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-indigo-800/60">
                <span className="text-[11px] text-indigo-300 font-semibold block uppercase">Estimated Delivery</span>
                <span className="text-base font-bold text-white">
                  {order.estimated_delivery || '3-5 Business Days'}
                </span>
              </div>
            </div>

            {/* Visual Tracking Progress Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Milestone Progress</h4>
              <div className="relative pl-6 space-y-6 border-l-2 border-slate-200 ml-3">
                {order.timeline && order.timeline.map((step, idx) => {
                  const isDone = step.completed;
                  const isCancelled = step.isCancelled;

                  return (
                    <div key={idx} className="relative group">
                      {/* Milestone Dot */}
                      <div
                        className={`absolute -left-[31px] top-0 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white ${
                          isCancelled
                            ? 'border-rose-500 text-rose-500'
                            : isDone
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 text-slate-300'
                        }`}
                      >
                        {isCancelled ? (
                          <Ban className="w-3 h-3" />
                        ) : isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        )}
                      </div>

                      {/* Content */}
                      <div>
                        <div className="flex items-center justify-between">
                          <h5 className={`text-xs font-bold ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.title}
                          </h5>
                          {step.time && (
                            <span className="text-[10px] text-slate-400">
                              {new Date(step.time).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Destination Address & Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1">
                <div className="flex items-center space-x-1 font-semibold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Delivery Destination</span>
                </div>
                <p className="text-slate-600">{order.shipping_name}</p>
                <p className="text-slate-500">{order.shipping_address}, {order.shipping_city} {order.shipping_postal_code}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1">
                <span className="font-semibold text-slate-800 block">Payment Summary</span>
                <div className="flex justify-between text-slate-500">
                  <span>Method:</span>
                  <span className="font-medium text-slate-700">{order.payment_method}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total Paid:</span>
                  <span className="font-bold text-indigo-600">${Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Ordered Items List */}
            <div>
              <h5 className="text-xs font-semibold text-slate-700 mb-2">Items in this Package:</h5>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {order.items && order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50/60 border border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      {item.image_url && (
                        <img src={item.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-800 block line-clamp-1">{item.product_name}</span>
                        <span className="text-[11px] text-slate-400">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-700">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cancel Action if applicable */}
            {['Pending', 'Processing'].includes(order.status) && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{cancelling ? 'Cancelling...' : 'Cancel Order'}</span>
                </button>
              </div>
            )}

          </div>
        ) : null}

      </div>
    </div>
  );
}

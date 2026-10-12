import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, CheckCircle2, Truck, Wallet, Banknote } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiPlaceOrder } from '../api';

export default function CheckoutModal({ isOpen, onClose, onOrderSuccess, onOpenAuth }) {
  const { cartItems, summary, clearCart } = useCart();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    shipping_name: user ? user.name : '',
    shipping_address: '742 Evergreen Terrace',
    shipping_city: 'Springfield',
    shipping_postal_code: '97477',
    shipping_phone: '+1 (555) 019-2834',
    payment_method: 'Credit Card'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onClose();
      onOpenAuth();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await apiPlaceOrder(formData);
      clearCart();
      onClose();
      onOrderSuccess(res.order);
    } catch (err) {
      setError(err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Checkout & Payment</h2>
            <p className="text-xs text-slate-500 mt-0.5">Complete your shipping and payment information</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {!user ? (
          <div className="py-8 text-center">
            <ShieldCheck className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Account required to place orders</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Please sign in or create an account to securely save your order and track shipping milestones in real-time.
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-100"
              >
                Sign In / Register
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            
            {/* Shipping Information */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>Shipping Address</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Recipient Name</label>
                  <input
                    type="text"
                    name="shipping_name"
                    required
                    value={formData.shipping_name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    name="shipping_address"
                    required
                    value={formData.shipping_address}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                    placeholder="123 Commerce Blvd, Suite 400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City / Region</label>
                  <input
                    type="text"
                    name="shipping_city"
                    required
                    value={formData.shipping_city}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                    placeholder="San Francisco"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Postal / ZIP Code</label>
                  <input
                    type="text"
                    name="shipping_postal_code"
                    required
                    value={formData.shipping_postal_code}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                    placeholder="94103"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    name="shipping_phone"
                    value={formData.shipping_phone}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                    placeholder="+1 555-0199"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Payment Method</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Credit Card', label: 'Credit Card', icon: CreditCard },
                  { id: 'PayPal / UPI', label: 'PayPal / UPI', icon: Wallet },
                  { id: 'Cash on Delivery', label: 'Cash on Del.', icon: Banknote },
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = formData.payment_method === pm.id;
                  return (
                    <button
                      type="button"
                      key={pm.id}
                      onClick={() => setFormData({ ...formData, payment_method: pm.id })}
                      className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center space-y-1.5 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order Summary Recap */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Items Subtotal ({summary.itemCount} items)</span>
                <span className="font-semibold text-slate-800">${summary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Sales Tax (8%)</span>
                <span className="font-semibold text-slate-800">${summary.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping</span>
                <span className="font-semibold text-slate-800">
                  {summary.shippingFee === 0 ? 'FREE' : `$${summary.shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Due</span>
                <span className="text-indigo-600 text-base">${summary.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 transition-all disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Processing Order...' : `Confirm & Place Order ($${summary.total.toFixed(2)})`}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderTrackingModal from './components/OrderTrackingModal';
import AuthModal from './components/AuthModal';
import StorePage from './pages/StorePage';
import OrdersPage from './pages/OrdersPage';
import AdminDashboard from './pages/AdminDashboard';
import { ShoppingBag, ShieldCheck, CheckCircle2 } from 'lucide-react';

function AppContent() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('store'); // 'store' | 'orders' | 'admin'
  const [authOpen, setAuthOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [orderSuccessBanner, setOrderSuccessBanner] = useState(null);

  const handleOrderSuccess = (order) => {
    setOrderSuccessBanner(order);
    setTrackingOrderId(order.orderId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* Floating Order Success Banner */}
      {orderSuccessBanner && (
        <div className="bg-emerald-600 text-white px-4 py-3 shadow-md flex items-center justify-between animate-fade-in">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between text-xs sm:text-sm font-medium">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>
                Order placed successfully! Tracking #{orderSuccessBanner.trackingNumber} for Order #{orderSuccessBanner.orderNumber}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setTrackingOrderId(orderSuccessBanner.orderId);
                }}
                className="underline font-bold hover:text-emerald-100"
              >
                Track Now
              </button>
              <button
                onClick={() => setOrderSuccessBanner(null)}
                className="text-white hover:text-emerald-200"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'store' && <StorePage />}
        
        {activeTab === 'orders' && (
          <OrdersPage onTrackOrder={(id) => setTrackingOrderId(id)} />
        )}

        {activeTab === 'admin' && (
          isAdmin ? (
            <AdminDashboard />
          ) : (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 p-8 max-w-md mx-auto my-12">
              <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-800">Admin Access Required</h2>
              <p className="text-xs text-slate-500 mt-1">
                You must be logged in as an administrator to view this portal.
              </p>
              <button
                onClick={() => setAuthOpen(true)}
                className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Sign In with Admin Account
              </button>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-700">NovaCart Full-Stack Store</span>
            <span>• Node.js + Express + SQLite + React</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Built-in Role Management: Admin & Customer</span>
            <span className="text-slate-300">|</span>
            <span>Real-time Order Milestones</span>
          </div>
        </div>
      </footer>

      {/* Side Slideout Cart Drawer */}
      <CartDrawer
        onCheckout={() => setCheckoutOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />

      {/* Order Tracking Modal */}
      {trackingOrderId && (
        <OrderTrackingModal
          orderId={trackingOrderId}
          onClose={() => setTrackingOrderId(null)}
          onStatusChange={() => {}}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

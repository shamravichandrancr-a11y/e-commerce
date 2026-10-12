import React, { useState } from 'react';
import { X, Star, ShoppingCart, ShieldCheck, Truck, RotateCcw, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductDetailModal({ product, onClose }) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const handleAdd = async () => {
    try {
      setLoading(true);
      await addToCart(product, qty);
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
        onClose();
      }, 1200);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Column */}
        <div className="md:w-1/2 bg-slate-50 relative flex items-center justify-center min-h-[300px] md:min-h-full">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover max-h-[450px]"
          />
          <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
            {product.category}
          </span>
        </div>

        {/* Product Details Column */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center space-x-2 text-amber-500 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating || 5)
                        ? 'fill-amber-400 stroke-amber-400'
                        : 'fill-slate-200 stroke-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-800">{product.rating || 4.8}</span>
              <span className="text-xs text-slate-400">({product.num_reviews || 25} reviews)</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900">{product.name}</h2>
            <div className="mt-2 text-2xl font-extrabold text-indigo-600">
              ${Number(product.price).toFixed(2)}
            </div>

            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>

            {/* Inventory Indicator */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
              <span className="font-medium text-slate-600">Stock Availability:</span>
              <span
                className={`font-semibold ${
                  isOutOfStock ? 'text-rose-600' : product.stock < 10 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {isOutOfStock ? 'Sold Out' : `${product.stock} items ready to ship`}
              </span>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 text-center">
              <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50">
                <Truck className="w-4 h-4 text-indigo-500 mb-1" />
                <span>Fast Shipping</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50">
                <ShieldCheck className="w-4 h-4 text-indigo-500 mb-1" />
                <span>Original Guarantee</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50">
                <RotateCcw className="w-4 h-4 text-indigo-500 mb-1" />
                <span>30-Day Return</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            {!isOutOfStock && (
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-xs font-semibold text-slate-700">Quantity:</span>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-3 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-sm font-semibold text-slate-800">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    className="px-3 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={isOutOfStock || loading}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-md ${
                added
                  ? 'bg-emerald-600 text-white'
                  : isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Currently Unavailable' : `Add to Cart • $${(product.price * qty).toFixed(2)}`}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

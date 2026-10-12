import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiGetCart, apiAddToCart, apiUpdateCartItem, apiRemoveCartItem, apiClearCart } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [summary, setSummary] = useState({ itemCount: 0, subtotal: 0, tax: 0, shippingFee: 0, total: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculate summary for local items
  const calculateLocalSummary = (items) => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Number((subtotal * 0.08).toFixed(2));
    const shippingFee = subtotal > 100 || items.length === 0 ? 0 : 9.99;
    const total = Number((subtotal + tax + shippingFee).toFixed(2));
    return {
      itemCount,
      subtotal: Number(subtotal.toFixed(2)),
      tax,
      shippingFee,
      total
    };
  };

  const refreshCart = useCallback(async () => {
    if (user) {
      try {
        setLoading(true);
        const data = await apiGetCart();
        setCartItems(data.items || []);
        setSummary(data.summary || calculateLocalSummary([]));
      } catch (err) {
        console.error('Failed to load server cart:', err);
      } finally {
        setLoading(false);
      }
    } else {
      const stored = localStorage.getItem('guest_cart');
      const items = stored ? JSON.parse(stored) : [];
      setCartItems(items);
      setSummary(calculateLocalSummary(items));
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (product, quantity = 1) => {
    if (user) {
      await apiAddToCart(product.id, quantity);
      await refreshCart();
    } else {
      const current = [...cartItems];
      const existingIndex = current.findIndex(i => i.product_id === product.id);
      if (existingIndex > -1) {
        const newQty = current[existingIndex].quantity + quantity;
        if (newQty > product.stock) {
          throw new Error(`Cannot add more than stock limit (${product.stock})`);
        }
        current[existingIndex].quantity = newQty;
      } else {
        current.push({
          id: 'guest_' + Date.now() + Math.random(),
          product_id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          stock: product.stock,
          quantity: quantity
        });
      }
      localStorage.setItem('guest_cart', JSON.stringify(current));
      setCartItems(current);
      setSummary(calculateLocalSummary(current));
    }
    setIsOpen(true);
  };

  const updateQuantity = async (itemId, productId, quantity) => {
    if (user) {
      await apiUpdateCartItem(itemId, quantity);
      await refreshCart();
    } else {
      let current = [...cartItems];
      if (quantity <= 0) {
        current = current.filter(i => i.id !== itemId);
      } else {
        const item = current.find(i => i.id === itemId);
        if (item) {
          if (quantity > item.stock) {
            throw new Error(`Only ${item.stock} items in stock.`);
          }
          item.quantity = quantity;
        }
      }
      localStorage.setItem('guest_cart', JSON.stringify(current));
      setCartItems(current);
      setSummary(calculateLocalSummary(current));
    }
  };

  const removeItem = async (itemId) => {
    if (user) {
      await apiRemoveCartItem(itemId);
      await refreshCart();
    } else {
      const current = cartItems.filter(i => i.id !== itemId);
      localStorage.setItem('guest_cart', JSON.stringify(current));
      setCartItems(current);
      setSummary(calculateLocalSummary(current));
    }
  };

  const clearCart = async () => {
    if (user) {
      await apiClearCart();
      await refreshCart();
    } else {
      localStorage.removeItem('guest_cart');
      setCartItems([]);
      setSummary(calculateLocalSummary([]));
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      summary,
      isOpen,
      setIsOpen,
      loading,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

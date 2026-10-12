const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred while processing the request.');
  }

  return data;
}

// Authentication
export const apiLogin = (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const apiRegister = (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
export const apiGetMe = () => request('/auth/me');

// Products
export const apiGetProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/products${query ? `?${query}` : ''}`);
};
export const apiGetCategories = () => request('/products/categories');
export const apiGetProduct = (id) => request(`/products/${id}`);
export const apiCreateProduct = (data) => request('/products', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateProduct = (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const apiDeleteProduct = (id) => request(`/products/${id}`, { method: 'DELETE' });

// Cart
export const apiGetCart = () => request('/cart');
export const apiAddToCart = (productId, quantity = 1) => request('/cart', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity }) });
export const apiUpdateCartItem = (id, quantity) => request(`/cart/${id}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
export const apiRemoveCartItem = (id) => request(`/cart/${id}`, { method: 'DELETE' });
export const apiClearCart = () => request('/cart', { method: 'DELETE' });

// Orders
export const apiPlaceOrder = (orderData) => request('/orders', { method: 'POST', body: JSON.stringify(orderData) });
export const apiGetOrders = () => request('/orders');
export const apiGetOrder = (id) => request(`/orders/${id}`);
export const apiCancelOrder = (id) => request(`/orders/${id}/cancel`, { method: 'PUT' });

// Admin
export const apiAdminGetOrders = () => request('/admin/orders');
export const apiAdminUpdateOrderStatus = (id, data) => request(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(data) });
export const apiAdminGetStats = () => request('/admin/stats');

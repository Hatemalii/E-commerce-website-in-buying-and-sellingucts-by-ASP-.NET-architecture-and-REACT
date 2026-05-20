// src/api/apiService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5221/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add interceptor to include JWT token in requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  // Auth
  login: (credentials) => api.post('/Auth/login', credentials),
  register: (userData) => api.post('/Auth/register', userData),

  // Products
  getProducts: (params) => api.get('/Products', { params }),
  getProductById: (id) => api.get(`/Products/${id}`),
  getVendorProducts: () => api.get('/Products/vendor/my'),
  createProduct: (productData) => api.post('/Products', productData),
  updateProduct: (id, productData) => api.put(`/Products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/Products/${id}`),

  // Categories
  getCategories: () => api.get('/Categories'),
  createCategory: (categoryData) => api.post('/Categories', categoryData),
  deleteCategory: (id) => api.delete(`/Categories/${id}`),

  // Orders
  createOrder: (orderData) => api.post('/Orders', orderData),
  getMyOrders: () => api.get('/Orders/my'),
  getOrderById: (id) => api.get(`/Orders/${id}`),
  getVendorSales: (from, to) => api.get('/Orders/vendor/sales', { params: { from, to } }),
  updateOrderStatus: (id, status) => api.patch(`/Orders/${id}/status`, JSON.stringify(status), { headers: { 'Content-Type': 'application/json' } }),

  // Favorites
  getFavorites: () => api.get('/Favorites'),
  addFavorite: (productId) => api.post('/Favorites', { productId }),
  removeFavorite: (productId) => api.delete(`/Favorites/${productId}`),

  // Reviews
  getProductReviews: (productId) => api.get(`/Reviews/product/${productId}`),
  createReview: (reviewData) => api.post('/Reviews', reviewData),

  // Notifications
  getNotifications: () => api.get('/Notifications'),
  markAsRead: (id) => api.put(`/Notifications/${id}/read`),
  markAllAsRead: () => api.put('/Notifications/mark-all-read'),

  // Admin
  getPendingVendors: () => api.get('/Admin/vendors/pending'),
  getApprovedVendors: () => api.get('/Admin/vendors/approved'),
  approveVendor: (id) => api.put(`/Admin/vendors/${id}/approve`),
  rejectVendor: (id, reason) => api.put(`/Admin/vendors/${id}/reject`, null, { params: { reason } }),
  getPendingProducts: () => api.get('/Admin/products/pending'),
  approveProduct: (id) => api.put(`/Admin/products/${id}/approve`),
  rejectProduct: (id, reason) => api.put(`/Admin/products/${id}/reject`, null, { params: { reason } }),
  getVendorPermissions: () => api.get('/Admin/permissions/vendors'),
  grantPermission: (vendorId, permissionKey) => api.post('/Admin/permissions', { vendorId, permissionKey }),
  revokePermission: (vendorId, permissionKey) => api.delete('/Admin/permissions', { data: { vendorId, permissionKey } }),
  getAdminStats: () => api.get('/Admin/stats'),
};

export default apiService;

import axios from 'axios';

const baseURL = '/api';
const API = axios.create({ baseURL });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('lib_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    // Auto logout on 401
    if (err.response?.status === 401 && err.response?.data?.message === 'Invalid token.') {
      localStorage.removeItem('lib_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const loginAPI = (data) => API.post('/auth/login', data);
export const registerAPI = (data) => API.post('/auth/register', data);
export const getMeAPI = () => API.get('/auth/me');
export const updateProfileAPI = (data) => API.put('/auth/profile', data);
export const changePasswordAPI = (data) => API.put('/auth/change-password', data);
export const forgotPasswordAPI = (data) => API.post('/auth/forgot-password', data);
export const resetPasswordAPI = (token, data) => API.put(`/auth/reset-password/${token}`, data);

// Addresses & Wishlist
export const getSavedAddressesAPI = () => API.get('/auth/addresses');
export const saveAddressAPI = (data) => API.post('/auth/addresses', data);
export const deleteAddressAPI = (idx) => API.delete(`/auth/addresses/${idx}`);
export const getWishlistAPI = () => API.get('/auth/wishlist');
export const toggleWishlistAPI = (data) => API.post('/auth/wishlist/toggle', data);

// Users (Admin)
export const getUsersAPI = (params) => API.get('/users', { params });
export const createUserAPI = (data) => API.post('/users', data);
export const updateUserAPI = (id, data) => API.put(`/users/${id}`, data);
export const deleteUserAPI = (id) => API.delete(`/users/${id}`);
export const toggleUserAPI = (id) => API.put(`/users/${id}/toggle`);
export const resetUserPasswordAPI = (id, data) => API.put(`/users/${id}/reset-password`, data); // requires server route

// Books
export const getBooksAPI = (params) => API.get('/books', { params });
export const getBookAPI = (id) => API.get(`/books/${id}`);
export const createBookAPI = (data) => API.post('/books', data);
export const updateBookAPI = (id, data) => API.put(`/books/${id}`, data);
export const deleteBookAPI = (id) => API.delete(`/books/${id}`);
export const getCategoryCountsAPI = () => API.get('/books/category-counts');
export const addBookReviewAPI = (id, data) => API.post(`/books/${id}/reviews`, data);

// Members
export const getMembersAPI = (params) => API.get('/members', { params });
export const createMemberAPI = (data) => API.post('/members', data);
export const updateMemberAPI = (id, data) => API.put(`/members/${id}`, data);
export const deleteMemberAPI = (id) => API.delete(`/members/${id}`);

// Issues
export const getIssuesAPI = (params) => API.get('/issues', { params });
export const createIssueAPI = (data) => API.post('/issues', data);
export const returnBookAPI = (id) => API.put(`/issues/${id}/return`);
export const deleteIssueAPI = (id) => API.delete(`/issues/${id}`);

// Dashboard
export const getDashboardAPI = () => API.get('/dashboard/stats');
export const getAdvancedDashboardAPI = () => API.get('/dashboard/advanced');
export const getAdminBadgesAPI = () => API.get('/dashboard/admin-badges');

// Orders
export const createOrderAPI = (data) => API.post('/orders', data);
export const getMyOrdersAPI = () => API.get('/orders/my');
export const getOrderByIdAPI = (id) => API.get(`/orders/${id}`);
export const cancelOrderRequestAPI = (id, reason) => API.put(`/orders/${id}/cancel-request`, { reason });
export const getAdminOrdersAPI = (params) => API.get('/orders/admin/all', { params });
export const updateOrderStatusAPI = (id, data) => API.put(`/orders/admin/${id}/status`, data);
export const getOrderStatsAPI = () => API.get('/orders/admin/stats');
export const downloadOrdersCSVAPI = (params) => API.get('/orders/admin/export/csv', { params, responseType: 'blob' });

// Payment (Razorpay)
export const getRazorpayKeyAPI        = () => API.get('/payment/razorpay-key');
export const createRazorpayOrderAPI  = (data) => API.post('/payment/razorpay-order', data);
export const verifyRazorpayPaymentAPI = (data) => API.post('/payment/verify', data);
export const initiateRefundAPI       = (data) => API.post('/payment/refund', data);
export const getRefundsAPI           = () => API.get('/payment/refunds');

// AI Chat
export const aiChatAPI = (data) => API.post('/chat', data);
export const aiAnalyticsAPI = () => API.get('/chat/stats');

// Contact
export const contactAPI = (data) => API.post('/contact', data);

// Newsletter
export const subscribeNewsletterAPI = (data) => API.post('/newsletter/subscribe', data);

// Find Related Books
export const getRelatedBooksAPI = (id) => API.get(`/books/${id}/related`);

// Recommended (Phase 6)
export const getRecommendedBooksAPI = () => API.get('/books/recommended');

// User Refund Request
export const refundRequestAPI = (id, reason) => API.put(`/orders/${id}/refund-request`, { reason });

// Complaints (User)
export const createComplaintAPI = (data) => API.post('/complaints', data);
export const getMyComplaintsAPI = () => API.get('/complaints/my');

// Complaints (Admin)
export const getAdminComplaintsAPI = (params) => API.get('/complaints/admin/all', { params });
export const getComplaintStatsAPI = () => API.get('/complaints/admin/stats');
export const updateComplaintAPI = (id, data) => API.put(`/complaints/admin/${id}`, data);

export default API;
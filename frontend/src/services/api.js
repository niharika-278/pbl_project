import axios from 'axios';

const baseURL = '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (body) => api.post('/auth/login', body),
  register: (body) => api.post('/auth/register', body),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (body) => api.post('/auth/reset-password', body),
  me: () => api.get('/auth/me'),
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

export const checkoutApi = {
  getCustomers: () => api.get('/checkout/customers'),
  searchCustomers: (q) => api.get('/checkout/customers/search', { params: { q } }),
  createCustomer: (body) => api.post('/checkout/customers', body),
  getProducts: (q = '') => api.get('/checkout/products', { params: { q } }),
  createOrder: (body) => api.post('/checkout/orders', body),
};

export const ingestionApi = {
  uploadCustomers: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/ingestion/customers', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => e.total && (e.loaded / e.total) * 100,
    });
  },
  uploadProducts: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/ingestion/products', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadInventory: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/ingestion/inventory', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadSales: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/ingestion/sales', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export default api;

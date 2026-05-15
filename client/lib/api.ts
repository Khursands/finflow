import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth — passwords are pre-encrypted on the client before calling these
export const authApi = {
  register: (data: { name: string; email: string; encryptedPassword: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; encryptedPassword: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Accounts
export const accountsApi = {
  getAll: () => api.get('/accounts'),
  create: (data: object) => api.post('/accounts', data),
  update: (id: string, data: object) => api.put(`/accounts/${id}`, data),
  delete: (id: string) => api.delete(`/accounts/${id}`),
};

// Categories
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  create: (data: object) => api.post('/categories', data),
  update: (id: string, data: object) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Transactions
export const transactionsApi = {
  getAll: (params?: object) => api.get('/transactions', { params }),
  create: (data: object) => api.post('/transactions', data),
  update: (id: string, data: object) => api.put(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
  getMonthlyStats: () => api.get('/transactions/stats/monthly'),
};

// Budgets
export const budgetsApi = {
  getAll: () => api.get('/budgets'),
  create: (data: object) => api.post('/budgets', data),
  update: (id: string, data: object) => api.put(`/budgets/${id}`, data),
  delete: (id: string) => api.delete(`/budgets/${id}`),
};

// Dashboard
export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
};

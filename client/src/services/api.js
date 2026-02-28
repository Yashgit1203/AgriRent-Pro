import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const register = (data) => api.post('/register', data);
export const login = (data) => api.post('/login', data);

// Equipment APIs
export const getEquipment = () => api.get('/equipment');
export const getAllEquipment = () => api.get('/equipment/all');
export const addEquipment = (data) => api.post('/equipment', data);
export const deactivateEquipment = (id) => api.put(`/equipment/${id}/deactivate`);
export const activateEquipment = (id) => api.put(`/equipment/${id}/activate`);

// Rental APIs
export const createRental = (data) => api.post('/rentals', data);
export const getMyRentals = () => api.get('/rentals/my');
export const getAllRentals = () => api.get('/rentals');
export const returnRental = (id) => api.put(`/rentals/${id}/return`);

// Reports & Stats
export const getRevenueReport = () => api.get('/reports/revenue');
export const getAuditLogs = () => api.get('/audit-logs');
export const getDashboardStats = () => api.get('/stats/dashboard');

export default api;
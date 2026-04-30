import axios from 'axios';

// Dynamically use the same host/port the app is served from.
// This works for localhost, LAN IP, and tunnel URLs equally.
const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eco_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('eco_token');
      localStorage.removeItem('eco_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

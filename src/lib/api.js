import axios from 'axios';

// Always use same-origin /api (Next.js rewrites proxy to real backend)
// This makes cookies work reliably on Vercel (no cross-origin issues)
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      'Request failed';
    return Promise.reject({ ...err, message });
  }
);

export default api;

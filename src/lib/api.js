import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

// Attach interceptor for consistent error shape
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
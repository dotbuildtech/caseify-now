import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000
});

let refreshPromise = null;
let redirectingToLogin = false;

api.interceptors.request.use((config) => {
    config._startTime = Date.now();
    return config;
});

api.interceptors.response.use(
    (res) => {
        const duration = Date.now() - (res.config._startTime || Date.now());
        if (duration > 1000) {
            console.warn(`[slow api] ${res.config.method?.toUpperCase()} ${res.config.url} took ${duration}ms`);
        }
        return res;
    },
    async (err) => {
        const original = err.config;
        if (err.response?.status === 401 && original && !original._retry && !original.url?.includes('/auth/')) {
            original._retry = true;
            if (!refreshPromise) {
                refreshPromise = axios.post('/api/auth/refresh').then(() => true).catch(() => false);
            }
            const refreshed = await refreshPromise;
            refreshPromise = null;
            if (refreshed) {
                return api(original);
            }
            if (!redirectingToLogin && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                redirectingToLogin = true;
                window.location.href = '/login';
            }
            return Promise.reject(err);
        }
        return Promise.reject(err);
    }
);

export const clearApiCache = () => {};

export default api;

import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000
});

let isRefreshing = false;
let isRedirectingToLogin = false;

api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config;
        if (err.response?.status === 401 && original && !original._retry && !original._skipAuthRetry && !original.url?.includes('/auth/')) {
            original._retry = true;
            if (isRefreshing) return Promise.reject(err);
            isRefreshing = true;
            try {
                await axios.post('/api/auth/refresh');
                return api(original);
            } catch {
                if (!isRedirectingToLogin && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                    isRedirectingToLogin = true;
                    window.location.href = '/login';
                }
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(err);
    }
);

export const clearApiCache = () => {};

export default api;

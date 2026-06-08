import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000
});

api.interceptors.request.use((config) => {
    const token = Cookies.get('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const memoryCache = new Map();
const CACHE_TTL = 30 * 1000;
const PUBLIC_GET_PATTERN = /^\/(products(\/[^/]+)?|categories|designs)/;

const isCacheable = (config) => {
    if (config.method?.toLowerCase() !== 'get') return false;
    if (config.headers?.Authorization) return false;
    return PUBLIC_GET_PATTERN.test(config.url || '');
};

api.interceptors.request.use((config) => {
    if (!isCacheable(config)) return config;
    const key = `${config.method}:${config.url}?${JSON.stringify(config.params || {})}`;
    const cached = memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
        config.adapter = () => Promise.resolve({ data: cached.data, status: 200, statusText: 'OK', headers: {}, config, request: {} });
    } else if (cached) {
        memoryCache.delete(key);
    }
    return config;
});

api.interceptors.response.use(
    (res) => {
        const config = res.config;
        if (isCacheable(config) && res.status === 200) {
            const key = `${config.method}:${config.url}?${JSON.stringify(config.params || {})}`;
            memoryCache.set(key, { data: res.data, expires: Date.now() + CACHE_TTL });
        }
        return res;
    },
    async (err) => {
        const original = err.config;
        if (err.response?.status === 401 && original && !original._retry) {
            original._retry = true;
            try {
                const refreshToken = Cookies.get('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');
                const { data } = await axios.post('/api/auth/refresh', { refreshToken });
                Cookies.set('accessToken', data.accessToken, { expires: 1 / 96 });
                original.headers = original.headers || {};
                original.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(original);
            } catch {
                Cookies.remove('accessToken');
                Cookies.remove('refreshToken');
                if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(err);
    }
);

export const clearApiCache = () => memoryCache.clear();

export default api;

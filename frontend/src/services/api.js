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

let isRedirectingToLogin = false;

api.interceptors.response.use(
    (res) => res,
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
                if (!isRedirectingToLogin && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                    isRedirectingToLogin = true;
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(err);
    }
);

export const clearApiCache = () => {};

export default api;

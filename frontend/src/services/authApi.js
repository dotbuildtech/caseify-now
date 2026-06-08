import api from './api';
import Cookies from 'js-cookie';

export const login = async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password });
    Cookies.set('accessToken', data.accessToken, { expires: 1 / 96 });
    if (data.refreshToken) Cookies.set('refreshToken', data.refreshToken, { expires: 7 });
    return data;
};

export const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    Cookies.set('accessToken', data.accessToken, { expires: 1 / 96 });
    if (data.refreshToken) Cookies.set('refreshToken', data.refreshToken, { expires: 7 });
    return data;
};

export const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
};

export const fetchProfile = () => api.get('/auth/profile').then((r) => r.data);

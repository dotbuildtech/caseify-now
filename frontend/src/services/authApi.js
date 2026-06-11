import api from './api';
import Cookies from 'js-cookie';

const storeTokens = (data) => {
    Cookies.set('accessToken', data.accessToken, { expires: 1 / 96 });
    if (data.refreshToken) Cookies.set('refreshToken', data.refreshToken, { expires: 7 });
};

export const login = async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password });
    storeTokens(data);
    return data;
};

export const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    storeTokens(data);
    return data;
};

export const googleLogin = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    storeTokens(data);
    return data;
};

export const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
};

export const fetchProfile = () => api.get('/auth/profile').then((r) => r.data);

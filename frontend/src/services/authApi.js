import api from './api';

export const login = async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
};

export const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
};

export const googleLogin = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    return data;
};

export const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
};

export const fetchProfile = () => api.get('/auth/profile', { _skipAuthRetry: true }).then((r) => r.data);

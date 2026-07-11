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

export const fetchProfile = () => api.get('/auth/profile').then((r) => r.data);

export const forgotPasswordOTP = async (email) => {
    const { data } = await api.post('/auth/forgot-password-otp', { email });
    return data;
};

export const verifyResetOTP = async (email, otp) => {
    const { data } = await api.post('/auth/verify-reset-otp', { email, otp });
    return data;
};

export const resetPasswordWithOTP = async (email, newPassword, confirmPassword) => {
    const { data } = await api.post('/auth/reset-password-with-otp', { email, newPassword, confirmPassword });
    return data;
};

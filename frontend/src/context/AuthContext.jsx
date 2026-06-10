'use client';
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import Cookies from 'js-cookie';
import { login as apiLogin, register as apiRegister, logout as apiLogout, fetchProfile } from '@/services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const accessToken = Cookies.get('accessToken');
        if (!accessToken) { setLoading(false); return; }
        let mounted = true;
        fetchProfile()
            .then((d) => { if (mounted) setUser(d?.data || d); })
            .catch(() => { if (mounted) setUser(null); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    const login = useCallback(async (creds) => {
        const data = await apiLogin(creds);
        const u = data?.user || data?.data?.user || data;
        setUser(u);
        return data;
    }, []);

    const register = useCallback(async (payload) => {
        const data = await apiRegister(payload);
        const u = data?.user || data?.data?.user || data;
        setUser(u);
        return data;
    }, []);

    const logout = useCallback(async () => {
        await apiLogout();
        setUser(null);
    }, []);

    const contextValue = useMemo(() => ({ user, loading, login, register, logout, setUser }), [user, loading, login, register, logout]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

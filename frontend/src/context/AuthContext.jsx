'use client';
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { login as apiLogin, register as apiRegister, googleLogin as apiGoogleLogin, logout as apiLogout, fetchProfile } from '@/services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const hasAuth = localStorage.getItem('auth_check');
        if (!hasAuth) {
            if (mounted) setLoading(false);
            return;
        }
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
        localStorage.setItem('auth_check', '1');
        return data;
    }, []);

    const register = useCallback(async (payload) => {
        const data = await apiRegister(payload);
        const u = data?.user || data?.data?.user || data;
        setUser(u);
        localStorage.setItem('auth_check', '1');
        return data;
    }, []);

    const googleLogin = useCallback(async (credential) => {
        const data = await apiGoogleLogin(credential);
        const u = data?.user || data?.data?.user || data;
        setUser(u);
        localStorage.setItem('auth_check', '1');
        return data;
    }, []);

    const logout = useCallback(async () => {
        await apiLogout();
        setUser(null);
        localStorage.removeItem('auth_check');
        localStorage.removeItem('dotbuild_recent_uploads');
    }, []);

    const contextValue = useMemo(() => ({ user, loading, login, register, googleLogin, logout, setUser }), [user, loading, login, register, googleLogin, logout]);

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

'use client';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import GoogleSignInButton from '@/components/ui/GoogleSignInButton';

function LoginContent() {
    const router = useRouter();
    const params = useSearchParams();
    const redirect = params.get('redirect') || '/';
    const { user, login, googleLogin } = useAuth();
    const toast = useToast();

    useEffect(() => {
        if (user) router.replace(redirect);
    }, [user, redirect, router]);
    const [form, setForm] = useState({ email: '', password: '' });
    const [submitting, setSubmitting] = useState(false);
    const [googleSubmitting, setGoogleSubmitting] = useState(false);

    const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await login(form);
            toast.success('Welcome back');
            router.push(redirect);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleSuccess = async (credential) => {
        try {
            setGoogleSubmitting(true);
            await googleLogin(credential);
            toast.success('Welcome back');
            router.push(redirect);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Google sign-in failed');
        } finally {
            setGoogleSubmitting(false);
        }
    };

    return (
        <div className="container-luxe py-12 md:py-20">
            <div className="mx-auto max-w-md">
                <span className="eyebrow">— Sign In</span>
                <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-editorial md:text-5xl">
                    Welcome <span className="italic-display">back</span>.
                </h1>
                <p className="mt-3 text-sm text-text-light">Login to track orders and manage profile.</p>

                <form onSubmit={submit} className="mt-10 space-y-5">
                    <div>
                        <label className="label-luxe">Email *</label>
                        <input required type="email" value={form.email} onChange={update('email')} className="input-luxe" />
                    </div>
                    <div>
                        <label className="label-luxe">Password *</label>
                        <input required type="password" value={form.password} onChange={update('password')} className="input-luxe" />
                    </div>
                    <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                        {submitting ? 'Signing in...' : 'Login'}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-3 text-text-light">or</span>
                    </div>
                </div>

                {googleSubmitting ? (
                    <div className="w-full py-3 text-center text-sm text-text-light">Connecting to Google...</div>
                ) : (
                    <GoogleSignInButton
                        onSuccess={handleGoogleSuccess}
                        onError={(msg) => toast.error(msg)}
                    />
                )}

                <p className="mt-6 text-center text-sm text-text-light">
                    Don't have account? <Link href="/register" className="font-medium text-ink hover:text-bronze">Register</Link>
                </p>
                <div className="mt-4 text-center">
                    <Link href="/track" className="text-xs uppercase tracking-[0.18em] text-text-light hover:text-ink">
                        Track without login →
                    </Link>
                </div>
            </div>
        </div>
    );
}

export const dynamic = 'force-dynamic';

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="container-luxe py-20"><div className="h-32 bg-background-light animate-pulse" /></div>}>
            <LoginContent />
        </Suspense>
    );
}

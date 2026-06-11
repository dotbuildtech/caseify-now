'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import GoogleSignInButton from '@/components/ui/GoogleSignInButton';

export default function RegisterPage() {
    const router = useRouter();
    const { register, googleLogin } = useAuth();
    const toast = useToast();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [submitting, setSubmitting] = useState(false);
    const [googleSubmitting, setGoogleSubmitting] = useState(false);

    const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await register(form);
            toast.success('Account created');
            router.push('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleSuccess = async (credential) => {
        try {
            setGoogleSubmitting(true);
            await googleLogin(credential);
            toast.success('Account created');
            router.push('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Google sign-in failed');
        } finally {
            setGoogleSubmitting(false);
        }
    };

    return (
        <div className="container-luxe py-12 md:py-20">
            <div className="mx-auto max-w-md">
                <span className="eyebrow">— Create Account</span>
                <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-editorial md:text-5xl">
                    Create <span className="italic-display">account</span>.
                </h1>
                <p className="mt-3 text-sm text-text-light">Join us for faster checkout and order tracking.</p>

                <form onSubmit={submit} className="mt-10 space-y-5">
                    <div>
                        <label className="label-luxe">Full Name *</label>
                        <input required value={form.name} onChange={update('name')} className="input-luxe" />
                    </div>
                    <div>
                        <label className="label-luxe">Email *</label>
                        <input required type="email" value={form.email} onChange={update('email')} className="input-luxe" />
                    </div>
                    <div>
                        <label className="label-luxe">Password *</label>
                        <input required minLength={6} type="password" value={form.password} onChange={update('password')} className="input-luxe" />
                    </div>
                    <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                        {submitting ? 'Creating...' : 'Create Account'}
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
                        text="continue_with"
                    />
                )}

                <p className="mt-6 text-center text-sm text-text-light">
                    Already have account? <Link href="/login" className="font-medium text-ink hover:text-bronze">Login</Link>
                </p>
            </div>
        </div>
    );
}

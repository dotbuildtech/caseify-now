'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const toast = useToast();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [submitting, setSubmitting] = useState(false);

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

                <p className="mt-6 text-center text-sm text-text-light">
                    Already have account? <Link href="/login" className="font-medium text-ink hover:text-bronze">Login</Link>
                </p>
            </div>
        </div>
    );
}

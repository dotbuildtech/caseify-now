'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import GoogleSignInButton from '@/components/ui/GoogleSignInButton';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const { register, googleLogin } = useAuth();
    const toast = useToast();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [googleSubmitting, setGoogleSubmitting] = useState(false);

    const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await register(form);
            toast.success('Account created successfully');
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
            toast.success('Account created successfully');
            router.push('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Google sign-in failed');
        } finally {
            setGoogleSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 overflow-hidden">
            {/* Subtle luxury ambient lighting */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] bg-gradient-to-b from-bronze/10 via-amber-500/5 to-transparent rounded-full blur-3xl -z-10"
            />

            <div className="w-full max-w-[460px] mx-auto">
                {/* Back Link */}
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-text-light transition-colors hover:text-ink"
                    >
                        ← Back to boutique
                    </Link>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[10px] font-medium uppercase tracking-[0.15em] text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Encrypted
                    </span>
                </div>

                {/* Luxury Glass Card */}
                <div className="relative rounded-2xl border border-border/80 bg-surface/95 backdrop-blur-md p-6 sm:p-8 shadow-xl shadow-black/[0.04] transition-shadow duration-300">
                    {/* Top Bronze Accent Shimmer */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-bronze/70 to-transparent" />

                    {/* Card Inner Form Container (Enforces exact 400px alignment) */}
                    <div className="w-full max-w-[400px] mx-auto">
                        {/* Header */}
                        <div className="text-center sm:text-left mb-8">
                            <span className="eyebrow">— New Membership</span>
                            <h1 className="mt-3 font-display text-3xl sm:text-4xl leading-tight tracking-tight text-ink">
                                Create <span className="italic-display">account</span>.
                            </h1>
                            <p className="mt-2 text-xs sm:text-sm text-text-light leading-relaxed">
                                Join Caseify Atelier for bespoke order tracking and private offers.
                            </p>
                        </div>

                        {/* Register Form */}
                        <form onSubmit={submit} className="space-y-4">
                            {/* Full Name */}
                            <div>
                                <label className="label-luxe mb-2 block text-[11px]">Full Name *</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-light/60">
                                        <User size={16} />
                                    </div>
                                    <input
                                        required
                                        value={form.name}
                                        onChange={update('name')}
                                        placeholder="Himmat Singh"
                                        autoComplete="name"
                                        className="w-full rounded-xl border border-border bg-background/50 pl-10 pr-4 py-3 text-sm text-ink placeholder:text-text-light/40 transition-all duration-200 focus:bg-surface focus:border-ink focus:ring-2 focus:ring-ink/5 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Email Field */}
                            <div>
                                <label className="label-luxe mb-2 block text-[11px]">Email Address *</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-light/60">
                                        <Mail size={16} />
                                    </div>
                                    <input
                                        required
                                        type="email"
                                        value={form.email}
                                        onChange={update('email')}
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                        className="w-full rounded-xl border border-border bg-background/50 pl-10 pr-4 py-3 text-sm text-ink placeholder:text-text-light/40 transition-all duration-200 focus:bg-surface focus:border-ink focus:ring-2 focus:ring-ink/5 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="label-luxe mb-2 block text-[11px]">Password (Min 6 Characters) *</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-light/60">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        required
                                        minLength={6}
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={update('password')}
                                        placeholder="••••••••••••"
                                        autoComplete="new-password"
                                        className="w-full rounded-xl border border-border bg-background/50 pl-10 pr-11 py-3 text-sm text-ink placeholder:text-text-light/40 transition-all duration-200 focus:bg-surface focus:border-ink focus:ring-2 focus:ring-ink/5 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-light/60 hover:text-ink transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="group relative mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink py-3.5 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-cream transition-all duration-300 hover:bg-bronze hover:shadow-lg hover:shadow-bronze/15 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={15} className="animate-spin" />
                                        <span>Creating account...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Create Account</span>
                                        <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                                <span className="bg-surface px-3 text-text-light tracking-[0.2em] font-medium">
                                    or continue with
                                </span>
                            </div>
                        </div>

                        {/* Google Sign-In Button */}
                        <div className="w-full">
                            {googleSubmitting ? (
                                <div className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background-light/30 text-xs font-medium text-text-light">
                                    <Loader2 size={15} className="animate-spin text-bronze" />
                                    <span>Connecting to Google...</span>
                                </div>
                            ) : (
                                <GoogleSignInButton
                                    onSuccess={handleGoogleSuccess}
                                    onError={(msg) => toast.error(msg)}
                                    text="signup_with"
                                />
                            )}
                        </div>

                        {/* Login Callout */}
                        <div className="mt-7 pt-6 border-t border-border/60 text-center">
                            <p className="text-xs text-text-light">
                                Already have an account?{' '}
                                <Link
                                    href="/login"
                                    className="font-semibold text-ink underline underline-offset-4 decoration-bronze/50 transition-colors hover:text-bronze hover:decoration-bronze"
                                >
                                    Log in
                                </Link>
                            </p>
                        </div>

                        {/* Trust Badge */}
                        <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-text-light/60">
                            <ShieldCheck size={13} className="text-emerald-600/80" />
                            <span>256-Bit SSL End-to-End Encryption</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

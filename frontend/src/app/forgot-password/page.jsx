'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import * as authApi from '@/services/authApi';

const STEPS = { EMAIL: 0, OTP: 1, RESET: 2 };

export default function ForgotPasswordPage() {
    const router = useRouter();
    const toast = useToast();

    const [step, setStep] = useState(STEPS.EMAIL);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [timer, setTimer] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const startTimer = () => {
        setTimer(60);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!email) return;
        try {
            setSubmitting(true);
            await authApi.forgotPasswordOTP(email);
            setStep(STEPS.OTP);
            startTimer();
            toast.success('OTP sent to your email');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) return;
        try {
            setSubmitting(true);
            await authApi.verifyResetOTP(email, otp);
            if (intervalRef.current) clearInterval(intervalRef.current);
            setStep(STEPS.RESET);
            toast.success('OTP verified');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        try {
            setSubmitting(true);
            await authApi.resetPasswordWithOTP(email, newPassword, confirmPassword);
            toast.success('Password reset successfully');
            router.push('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setSubmitting(false);
        }
    };

    const resendOTP = async () => {
        if (timer > 0) return;
        try {
            setSubmitting(true);
            await authApi.forgotPasswordOTP(email);
            startTimer();
            toast.success('OTP resent to your email');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container-luxe py-12 md:py-20">
            <div className="mx-auto max-w-md">
                <span className="eyebrow">— Forgot Password</span>
                <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-editorial md:text-5xl">
                    Reset <span className="italic-display">password</span>.
                </h1>
                <p className="mt-3 text-sm text-text-light">
                    {step === STEPS.EMAIL && 'Enter your email to receive a password reset OTP.'}
                    {step === STEPS.OTP && 'Enter the 6-digit OTP sent to your email.'}
                    {step === STEPS.RESET && 'Choose a new password for your account.'}
                </p>

                {step === STEPS.EMAIL && (
                    <form onSubmit={handleSendOTP} className="mt-10 space-y-5">
                        <div>
                            <label className="label-luxe">Email *</label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-luxe"
                                placeholder="your@email.com"
                            />
                        </div>
                        <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                            {submitting ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {step === STEPS.OTP && (
                    <form onSubmit={handleVerifyOTP} className="mt-10 space-y-5">
                        <div>
                            <label className="label-luxe">OTP *</label>
                            <input
                                required
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="input-luxe text-center text-2xl tracking-[0.3em]"
                                placeholder="000000"
                                autoComplete="one-time-code"
                            />
                        </div>
                        <button type="submit" disabled={submitting || otp.length !== 6} className="btn-primary w-full disabled:opacity-50">
                            {submitting ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <div className="text-center text-sm text-text-light">
                            {timer > 0 ? (
                                <span>Resend OTP in <strong className="text-ink">{timer}s</strong></span>
                            ) : (
                                <button type="button" onClick={resendOTP} disabled={submitting} className="font-medium text-bronze hover:underline disabled:opacity-50">
                                    Resend OTP
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {step === STEPS.RESET && (
                    <form onSubmit={handleResetPassword} className="mt-10 space-y-5">
                        <div>
                            <label className="label-luxe">New Password *</label>
                            <input
                                required
                                type="password"
                                minLength={8}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="input-luxe"
                                placeholder="Min 8 characters"
                            />
                        </div>
                        <div>
                            <label className="label-luxe">Confirm Password *</label>
                            <input
                                required
                                type="password"
                                minLength={8}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input-luxe"
                                placeholder="Re-enter new password"
                            />
                        </div>
                        <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                            {submitting ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <p className="mt-6 text-center text-sm text-text-light">
                    Remember your password?{' '}
                    <Link href="/login" className="font-medium text-ink hover:text-bronze">Login</Link>
                </p>
            </div>
        </div>
    );
}

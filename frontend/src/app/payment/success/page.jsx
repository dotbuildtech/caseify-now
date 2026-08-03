'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { verifyPayuSuccess } from '@/services/paymentApi';
import { collectPayuResponse } from '@/lib/payu';
import { formatINR } from '@/utils/format';
import { useCart } from '@/context/CartContext';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { clear } = useCart();
    const [state, setState] = useState({ status: 'verifying', error: null, data: null });

    const run = useCallback(async () => {
        const payuParams = collectPayuResponse(searchParams);
        if (!payuParams.txnid || !payuParams.hash || !payuParams.status) {
            setState({ status: 'error', error: 'Invalid payment confirmation URL.', data: null });
            return;
        }
        try {
            const res = await verifyPayuSuccess(payuParams);
            setState({ status: 'success', data: res, error: null });
            try { await clear(); } catch { /* best-effort cart clear */ }
        } catch (err) {
            const message = err.response?.data?.message || 'Payment verification failed. Contact support with your transaction ID.';
            setState({ status: 'error', error: message, data: null });
        }
    }, [searchParams, clear]);

    useEffect(() => {
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Payment confirmed -> take the user to the order confirmation page.
    useEffect(() => {
        if (state.status === 'success' && state.data?.orderId) {
            const t = setTimeout(() => router.replace(`/order-confirmation/${state.data.orderId}`), 1200);
            return () => clearTimeout(t);
        }
    }, [state, router]);

    if (state.status === 'verifying') {
        return (
            <div className="container-luxe py-24 text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-text-light" strokeWidth={1.25} />
                <p className="mt-6 text-sm uppercase tracking-[0.18em] text-text-light">Verifying your payment…</p>
            </div>
        );
    }

    if (state.status === 'error') {
        return (
            <div className="container-luxe py-20">
                <div className="mx-auto max-w-md border border-border bg-surface p-10 text-center">
                    <AlertTriangle className="mx-auto h-10 w-10 text-error" strokeWidth={1.25} />
                    <h1 className="mt-6 font-display text-3xl">Payment <span className="italic-display">pending</span>.</h1>
                    <p className="mt-3 text-sm text-text-light">{state.error}</p>
                    <p className="mt-2 text-xs text-text-light">You can refresh this page to re-check, or check your orders.</p>
                    <div className="mt-8 flex flex-col gap-3">
                        <button onClick={run} className="btn-secondary w-full">Refresh Status</button>
                        <Link href="/orders" className="btn-primary w-full">View My Orders</Link>
                        <Link href="/contact" className="btn-ghost w-full">Contact Support</Link>
                    </div>
                </div>
            </div>
        );
    }

    const amount = state.data?.amount;

    return (
        <div className="container-luxe py-20">
            <div className="mx-auto max-w-md border border-border bg-surface p-10 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-success" strokeWidth={1.25} />
                <span className="eyebrow mt-6 inline-block">— Payment Successful</span>
                <h1 className="mt-4 font-display text-4xl">Thank you for your <span className="italic-display">purchase</span>.</h1>
                <p className="mt-3 text-sm text-text-light">
                    Your payment is confirmed and your order has been placed. Taking you to your order…
                </p>

                <dl className="mt-8 space-y-2 border-t border-border pt-6 text-left text-sm">
                    <div className="flex justify-between gap-4">
                        <dt className="text-text-light">Order ID</dt>
                        <dd className="font-mono">#{state.data?.orderId}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-text-light">Transaction ID</dt>
                        <dd className="max-w-[60%] break-all text-right font-mono text-xs">{state.data?.transactionId}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-text-light">Amount Paid</dt>
                        <dd className="font-semibold tabular-nums">{formatINR(amount)}</dd>
                    </div>
                </dl>

                <div className="mt-8 flex flex-col gap-3">
                    <button onClick={() => router.replace(`/order-confirmation/${state.data?.orderId}`)} className="btn-primary w-full">View My Order</button>
                    <Link href="/shop" className="btn-ghost w-full">Continue Shopping</Link>
                </div>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div className="container-luxe py-24 text-center"><p className="text-sm uppercase tracking-[0.18em] text-text-light">Loading…</p></div>}>
            <SuccessContent />
        </Suspense>
    );
}

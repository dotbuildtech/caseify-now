'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, Loader2 } from 'lucide-react';
import { verifyPayuFailure } from '@/services/paymentApi';
import { collectPayuResponse } from '@/lib/payu';

function FailureContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [state, setState] = useState({ status: 'verifying', reason: null });

    const run = useCallback(async () => {
        const payuParams = collectPayuResponse(searchParams);
        if (!payuParams.txnid || !payuParams.hash || !payuParams.status) {
            setState({ status: 'error', reason: null });
            return;
        }
        try {
            const res = await verifyPayuFailure(payuParams);
            if (res?.success) {
                // User actually paid but landed on the failure page
                router.replace(`/order-confirmation/${res.orderId}`);
                return;
            }
            setState({ status: 'failed', reason: res?.reason || null });
        } catch (err) {
            setState({
                status: 'failed',
                reason: err.response?.data?.message || 'Payment failed or was cancelled.'
            });
        }
    }, [searchParams, router]);

    useEffect(() => {
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (state.status === 'verifying') {
        return (
            <div className="container-luxe py-24 text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-text-light" strokeWidth={1.25} />
                <p className="mt-6 text-sm uppercase tracking-[0.18em] text-text-light">Checking payment status…</p>
            </div>
        );
    }

    return (
        <div className="container-luxe py-20">
            <div className="mx-auto max-w-md border border-border bg-surface p-10 text-center">
                <XCircle className="mx-auto h-12 w-12 text-error" strokeWidth={1.25} />
                <span className="eyebrow mt-6 inline-block">— Payment Failed</span>
                <h1 className="mt-4 font-display text-4xl">Payment <span className="italic-display">not completed</span>.</h1>
                <p className="mt-3 text-sm text-text-light">
                    {state.reason || 'Your payment could not be completed. No amount was charged and no order was placed.'}
                </p>

                <div className="mt-8 flex flex-col gap-3">
                    <Link href="/checkout" className="btn-primary w-full">Try Again from Checkout</Link>
                    <Link href="/cart" className="btn-secondary w-full">Back to Cart</Link>
                    <Link href="/contact" className="btn-ghost w-full">Contact Support</Link>
                </div>
            </div>
        </div>
    );
}

export default function PaymentFailurePage() {
    return (
        <Suspense fallback={<div className="container-luxe py-24 text-center"><p className="text-sm uppercase tracking-[0.18em] text-text-light">Loading…</p></div>}>
            <FailureContent />
        </Suspense>
    );
}

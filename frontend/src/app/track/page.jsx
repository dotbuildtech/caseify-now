'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { fetchOrderById } from '@/services/orderApi';
import { formatINR, formatDate } from '@/utils/format';

export default function TrackOrderPage() {
    const router = useRouter();
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
    const [order, setOrder] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError(''); setOrder(null);
        try {
            setLoading(true);
            const d = await fetchOrderById(orderId.trim());
            setOrder(d?.data || d);
        } catch (err) {
            setError('Order not found. Please check the Order ID.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-luxe py-12 md:py-20">
            <div className="mx-auto max-w-2xl">
                <span className="eyebrow">— Order Tracking</span>
                <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl">
                    Track your <span className="italic-display">order</span>.
                </h1>
                <p className="mt-3 text-sm text-text-light">Enter Order ID and email to track delivery status.</p>

                <form onSubmit={submit} className="mt-10 space-y-5">
                    <div>
                        <label className="label-luxe">Order ID *</label>
                        <input required value={orderId} onChange={(e) => setOrderId(e.target.value)} className="input-luxe" placeholder="e.g. 64f..." />
                    </div>
                    <div>
                        <label className="label-luxe">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-luxe" />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                        {loading ? 'Searching...' : (<><Search className="h-3 w-3" /> Track</>)}
                    </button>
                </form>

                {error && <p className="mt-6 border border-error bg-error/5 p-4 text-sm text-error">{error}</p>}

                {order && (
                    <div className="mt-10 border border-border bg-surface p-6">
                        <h2 className="font-display text-2xl">Order #{order._id || order.id}</h2>
                        <p className="mt-2 text-xs text-text-light">Placed on {formatDate(order.createdAt)}</p>
                        <p className="mt-4 text-sm">
                            <span className="font-medium">Status:</span>{' '}
                            <span className="border border-border bg-background-light px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em]">{order.status || 'pending'}</span>
                        </p>
                        <p className="mt-4 text-sm">
                            <span className="font-medium">Total:</span> <span className="font-semibold tabular-nums">{formatINR(order.totalPrice)}</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

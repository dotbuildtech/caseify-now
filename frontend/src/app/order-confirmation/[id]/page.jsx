'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, Package, Truck, MapPin } from 'lucide-react';
import { fetchOrderById } from '@/services/orderApi';
import { formatINR, formatDate } from '@/utils/format';
import SmartImage from '@/components/ui/SmartImage';

const getItemImage = (i) => {
    if (i.Product?.image) return i.Product.image;
    if (i.Product?.images?.length) {
        const first = i.Product.images[0];
        return typeof first === 'string' ? first : first?.url;
    }
    return i.image || 'https://images.unsplash.com/photo-1526738549149-8e07ead6a224?auto=format&fit=crop&w=200&q=70';
};

const getItemName = (i) => i.name || i.Product?.name || 'Product';
const getItemPrice = (i) => Number(i.price ?? i.Product?.price ?? 0);
const getItemQty = (i) => Number(i.qty ?? i.quantity ?? 0);

const STATUS_STEPS = ['Ordered', 'Processing', 'Shipped', 'Delivered'];

export default function OrderConfirmationPage() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        fetchOrderById(id)
            .then((d) => { if (mounted) setOrder(d); })
            .catch(() => { if (mounted) setOrder(null); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [id]);

    if (loading) return <div className="container-luxe py-20"><div className="h-32 bg-background-light animate-pulse" /></div>;
    if (!order) return (
        <div className="container-luxe py-20 text-center">
            <h1 className="font-display text-3xl">Order not found</h1>
            <Link href="/shop" className="btn-primary mt-6 inline-flex">Continue Shopping</Link>
        </div>
    );

    const items = order.items || order.orderItems || [];
    const status = order.orderStatus || order.status || 'Ordered';
    const currentStepIdx = STATUS_STEPS.indexOf(status);

    return (
        <div className="container-luxe py-12 md:py-20">
            <div className="mx-auto max-w-3xl text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
                <span className="eyebrow mt-6 inline-block">— Order Confirmed</span>
                <h1 className="mt-4 font-display text-4xl md:text-5xl">
                    Thank you for your <span className="italic-display">purchase</span>.
                </h1>
                <p className="mt-3 text-sm text-text-light">Confirmation email sent. Order ID: <span className="font-mono">#{id}</span></p>
            </div>

            <div className="mx-auto mt-12 grid max-w-3xl gap-6">
                <div className="border border-border bg-surface p-6">
                    <h2 className="font-display text-2xl">Order Tracking</h2>
                    <div className="mt-6">
                        <div className="flex items-center justify-between">
                            {STATUS_STEPS.map((step, i) => (
                                <div key={step} className="flex flex-1 flex-col items-center">
                                    <div className={`flex h-9 w-9 items-center justify-center border-2 ${i <= currentStepIdx ? 'border-ink bg-ink text-cream' : 'border-border text-text-light'}`}>
                                        {step === 'Ordered' && <Package className="h-4 w-4" />}
                                        {step === 'Processing' && <CheckCircle2 className="h-4 w-4" />}
                                        {step === 'Shipped' && <Truck className="h-4 w-4" />}
                                        {step === 'Delivered' && <MapPin className="h-4 w-4" />}
                                    </div>
                                    <p className={`mt-2 text-[10px] font-medium uppercase tracking-[0.18em] ${i <= currentStepIdx ? 'text-ink' : 'text-text-light'}`}>{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm border-t border-border pt-4">
                        <span className="font-mono text-text-light">#{id}</span>
                        <span className="border border-border bg-background-light px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em]">{status}</span>
                    </div>
                    <p className="mt-2 text-xs text-text-light">Placed on {formatDate(order.createdAt)}</p>
                </div>

                <div className="border border-border bg-surface p-6">
                    <h2 className="font-display text-2xl">Items</h2>
                    <ul className="mt-4 divide-y divide-border">
                        {items.map((it, i) => {
                            const qty = getItemQty(it);
                            const price = getItemPrice(it);
                            return (
                                <li key={it.id || i} className="flex items-center gap-4 py-3">
                                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden bg-background-light">
                                        <SmartImage src={getItemImage(it)} alt={getItemName(it)} fill sizes="80px" className="object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm font-medium">{getItemName(it)}</p>
                                        <p className="text-xs text-text-light">Qty: {qty}</p>
                                    </div>
                                    <p className="text-sm font-semibold tabular-nums">{formatINR(price * qty)}</p>
                                </li>
                            );
                        })}
                    </ul>
                    <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
                        <div className="flex justify-between"><dt className="text-text-light">Subtotal</dt><dd className="tabular-nums">{formatINR(order.itemsPrice)}</dd></div>
                        <div className="flex justify-between"><dt className="text-text-light">Shipping</dt><dd className="tabular-nums">{Number(order.shippingPrice) === 0 ? 'Free' : formatINR(order.shippingPrice)}</dd></div>
                        <div className="flex justify-between"><dt className="text-text-light">Tax</dt><dd className="tabular-nums">{formatINR(order.taxPrice)}</dd></div>
                        <div className="flex justify-between border-t border-border pt-3">
                            <dt className="font-display text-lg">Total</dt>
                            <dd className="font-display text-2xl font-semibold tabular-nums">{formatINR(order.totalPrice)}</dd>
                        </div>
                    </dl>
                </div>

                {order.shippingAddress && (
                    <div className="border border-border bg-surface p-6">
                        <h2 className="font-display text-2xl">Delivery Address</h2>
                        <p className="mt-3 text-sm">
                            {order.shippingAddress.fullName}<br />
                            {order.shippingAddress.address}<br />
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                            {order.shippingAddress.country}<br />
                            Phone: {order.shippingAddress.phone}
                        </p>
                    </div>
                )}

                <div className="flex flex-wrap gap-3">
                    <Link href="/shop" className="btn-secondary">Continue Shopping</Link>
                    <Link href="/orders" className="btn-primary">Track Order</Link>
                </div>
            </div>
        </div>
    );
}

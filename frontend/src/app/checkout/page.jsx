'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { createOrder } from '@/services/orderApi';
import { formatINR } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';

const TAX_RATE = 0.18;
const SHIPPING_FEE = 49;
const FREE_SHIPPING_THRESHOLD = 500;

export default function CheckoutPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { items, subtotal, summary, getItemQty, getItemPrice, getItemProductId, getItemImage, getItemName, clear } = useCart();
    const toast = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        paymentMethod: 'cod'
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login?redirect=/checkout');
        }
    }, [authLoading, user, router]);

    if (authLoading) {
        return (
            <div className="container-luxe py-20 text-center">
                <p className="text-sm uppercase tracking-[0.18em] text-text-light">Loading…</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container-luxe py-20">
                <div className="mx-auto max-w-md border border-dashed border-border bg-surface p-12 text-center">
                    <Lock className="mx-auto h-10 w-10 text-text-light" strokeWidth={1.25} />
                    <h2 className="mt-6 font-display text-3xl">Sign in to <span className="italic-display">checkout</span>.</h2>
                    <p className="mt-2 text-sm text-text-light">You need an account to place an order.</p>
                    <Link href="/login?redirect=/checkout" className="btn-primary mt-8">Login to Continue</Link>
                    <Link href="/cart" className="btn-ghost mt-3 w-full justify-center">Back to Cart</Link>
                </div>
            </div>
        );
    }

    const computedSubtotal = subtotal || summary?.subtotal || 0;
    const shipping = computedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : (computedSubtotal > 0 ? SHIPPING_FEE : 0);
    const tax = Math.round(computedSubtotal * TAX_RATE);
    const total = computedSubtotal + shipping + tax;

    const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        if (items.length === 0) return;
        try {
            setSubmitting(true);
            const orderItems = items.map((i) => ({
                product: getItemProductId(i),
                qty: getItemQty(i),
                designMeta: i.designMeta || null
            }));
            const order = await createOrder({
                orderItems,
                shippingAddress: {
                    fullName: form.fullName,
                    phone: form.phone,
                    address: form.address,
                    city: form.city,
                    state: form.state,
                    postalCode: form.postalCode,
                    country: form.country
                },
                paymentMethod: form.paymentMethod
            });
            const orderId = order?.id || order?._id || order?.data?.id;
            await clear();
            toast.success('Order placed successfully');
            router.push(`/order-confirmation/${orderId || ''}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Order failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="container-luxe py-20 text-center">
                <h1 className="font-display text-3xl">Your cart is empty.</h1>
                <Link href="/shop" className="btn-primary mt-6">Continue Shopping</Link>
            </div>
        );
    }

    return (
        <div className="container-luxe py-12 md:py-20">
            <div className="mb-10">
                <span className="eyebrow">— Secure Checkout</span>
                <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl">
                    Secure <span className="italic-display">Checkout</span>.
                </h1>
            </div>

            <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_360px]">
                <div className="space-y-8">
                    <section>
                        <h2 className="font-display text-2xl">Delivery Address</h2>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="label-luxe">Full Name *</label>
                                <input required value={form.fullName} onChange={update('fullName')} className="input-luxe" />
                            </div>
                            <div>
                                <label className="label-luxe">Phone *</label>
                                <input required value={form.phone} onChange={update('phone')} className="input-luxe" />
                            </div>
                            <div>
                                <label className="label-luxe">Email *</label>
                                <input required type="email" value={form.email} onChange={update('email')} className="input-luxe" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="label-luxe">Address *</label>
                                <input required value={form.address} onChange={update('address')} className="input-luxe" />
                            </div>
                            <div>
                                <label className="label-luxe">City *</label>
                                <input required value={form.city} onChange={update('city')} className="input-luxe" />
                            </div>
                            <div>
                                <label className="label-luxe">State *</label>
                                <input required value={form.state} onChange={update('state')} className="input-luxe" />
                            </div>
                            <div>
                                <label className="label-luxe">Postal Code *</label>
                                <input required value={form.postalCode} onChange={update('postalCode')} className="input-luxe" />
                            </div>
                            <div>
                                <label className="label-luxe">Country *</label>
                                <input required value={form.country} onChange={update('country')} className="input-luxe" />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="font-display text-2xl">Payment Method</h2>
                        <div className="mt-6 space-y-3">
                            {[
                                { v: 'cod', l: 'Cash on Delivery', d: 'Pay when you receive' },
                                { v: 'upi', l: 'UPI', d: 'Pay via UPI apps (Razorpay)' },
                                { v: 'card', l: 'Credit/Debit Card', d: 'Visa, Mastercard, Rupay (Razorpay)' }
                            ].map((m) => (
                                <label
                                    key={m.v}
                                    className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors ${form.paymentMethod === m.v ? 'border-ink bg-background-light' : 'border-border hover:border-ink'}`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value={m.v}
                                        checked={form.paymentMethod === m.v}
                                        onChange={update('paymentMethod')}
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="text-sm font-medium">{m.l}</p>
                                        <p className="text-xs text-text-light">{m.d}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </section>
                </div>

                <aside className="h-fit border border-border bg-surface p-6 md:p-8">
                    <h2 className="font-display text-2xl">Order Summary</h2>
                    <ul className="mt-6 space-y-3 text-sm">
                        {items.map((i) => {
                            const name = getItemName(i);
                            const qty = getItemQty(i);
                            const price = getItemPrice(i);
                            return (
                                <li key={getItemProductId(i)} className="flex justify-between gap-3">
                                    <span className="text-text-light">{name} × {qty}</span>
                                    <span className="tabular-nums">{formatINR(price * qty)}</span>
                                </li>
                            );
                        })}
                    </ul>
                    <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
                        <div className="flex justify-between"><dt className="text-text-light">Subtotal</dt><dd className="tabular-nums">{formatINR(computedSubtotal)}</dd></div>
                        <div className="flex justify-between"><dt className="text-text-light">Shipping</dt><dd className="tabular-nums">{shipping === 0 ? 'Free' : formatINR(shipping)}</dd></div>
                        <div className="flex justify-between"><dt className="text-text-light">Tax (18% GST)</dt><dd className="tabular-nums">{formatINR(tax)}</dd></div>
                        <div className="flex justify-between border-t border-border pt-3">
                            <dt className="font-display text-lg">Total</dt>
                            <dd className="font-display text-2xl font-semibold tabular-nums">{formatINR(total)}</dd>
                        </div>
                    </dl>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary mt-6 w-full disabled:opacity-50"
                    >
                        {submitting ? 'Processing...' : 'Place Order'}
                    </button>
                </aside>
            </form>
        </div>
    );
}

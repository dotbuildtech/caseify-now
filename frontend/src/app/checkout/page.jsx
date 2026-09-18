'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { createOrder } from '@/services/orderApi';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/services/paymentApi';
import { openRazorpayModal } from '@/lib/razorpay';
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
        paymentMethod: 'online'
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login?redirect=/checkout');
        } else if (user) {
            setForm((prev) => ({
                ...prev,
                fullName: prev.fullName || user.name || '',
                email: prev.email || user.email || '',
                phone: (prev.phone || user.phone || '').replace(/\D/g, '').slice(0, 10)
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, user]);

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

    const update = (k) => (e) => {
        let val = e.target.value;
        if (k === 'phone') {
            val = val.replace(/\D/g, '').slice(0, 10);
        } else if (k === 'postalCode') {
            val = val.replace(/\D/g, '').slice(0, 6);
        } else if (k === 'city' || k === 'state' || k === 'country') {
            val = val.replace(/[^a-zA-Z\s]/g, '');
        }
        setForm((f) => ({ ...f, [k]: val }));
    };

    const submit = async (e) => {
        e.preventDefault();
        if (items.length === 0) return;

        if (form.phone.length !== 10) {
            toast.error('Phone number must be exactly 10 digits.');
            return;
        }

        if (form.postalCode.length !== 6) {
            toast.error('Postal code must be exactly 6 digits.');
            return;
        }

        if (!form.city.trim() || !/^[A-Za-z\s]+$/.test(form.city.trim())) {
            toast.error('City must contain letters only.');
            return;
        }

        if (!form.state.trim() || !/^[A-Za-z\s]+$/.test(form.state.trim())) {
            toast.error('State must contain letters only.');
            return;
        }

        if (!form.country.trim() || !/^[A-Za-z\s]+$/.test(form.country.trim())) {
            toast.error('Country must contain letters only.');
            return;
        }

        try {
            setSubmitting(true);
            const orderItems = items.map((i) => ({
                product: getItemProductId(i),
                qty: getItemQty(i),
                designMeta: i.designMeta || null
            }));
            const shippingAddress = {
                fullName: form.fullName,
                email: form.email,
                phone: form.phone,
                address: form.address,
                city: form.city,
                state: form.state,
                postalCode: form.postalCode,
                country: form.country
            };

            // Online payment with Razorpay
            if (form.paymentMethod === 'online') {
                // 1. Calculate amount & create Razorpay session on backend
                const rzpOrderData = await createRazorpayOrder({
                    orderItems,
                    shippingAddress,
                    paymentMethod: 'online'
                });

                if (!rzpOrderData || !rzpOrderData.orderId) {
                    throw new Error('Could not initiate Razorpay payment session');
                }

                // 2. Open official Razorpay Checkout Modal
                await openRazorpayModal({
                    keyId: rzpOrderData.keyId,
                    orderId: rzpOrderData.orderId,
                    amount: rzpOrderData.amount,
                    currency: rzpOrderData.currency || 'INR',
                    name: 'Caseify Now',
                    description: 'Custom Phone Case Purchase',
                    prefill: {
                        name: rzpOrderData.prefill?.name || form.fullName,
                        email: rzpOrderData.prefill?.email || form.email,
                        contact: rzpOrderData.prefill?.contact || form.phone
                    },
                    themeColor: '#111827',
                    onSuccess: async (response) => {
                        try {
                            setSubmitting(true);
                            // 3. Verify payment signature on backend
                            const verified = await verifyRazorpayPayment({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });

                            if (verified?.success && verified?.orderId) {
                                try { await clear(); } catch { /* best-effort cart clear */ }
                                toast.success('Payment verified! Order placed successfully.');
                                router.push(`/order-confirmation/${verified.orderId}`);
                            } else {
                                toast.error('Payment verification failed. Please contact support.');
                                setSubmitting(false);
                            }
                        } catch (verErr) {
                            console.error('Verification error:', verErr);
                            toast.error(verErr.response?.data?.message || 'Payment verification failed. Please check your orders.');
                            setSubmitting(false);
                        }
                    },
                    onFailure: (err) => {
                        console.warn('Razorpay payment cancelled or failed:', err);
                        setSubmitting(false);
                        const isUserCancel =
                            err?.reason === 'payment_cancelled' ||
                            err?.source === 'customer' ||
                            /cancel|closed|dismissed/i.test(err?.description || '') ||
                            /cancel|closed|dismissed/i.test(err?.reason || '');

                        // Do not show an error popup if the customer cancelled the payment
                        if (!isUserCancel && err?.description) {
                            toast.error(err.description);
                        }
                    },
                    onDismiss: () => {
                        setSubmitting(false);
                    }
                });

                // Reset submitting state once the payment modal is active on screen
                setSubmitting(false);
                return;
            }

            // Cash on Delivery flow
            const order = await createOrder({ orderItems, shippingAddress, paymentMethod: form.paymentMethod });
            const orderId = order?.id || order?._id || order?.data?.id;
            if (!orderId) {
                toast.error('Order was placed but no ID returned. Check your orders.');
                router.push('/orders');
                return;
            }
            try { await clear(); } catch { /* best-effort cart clear */ }
            toast.success('Order placed successfully');
            router.push(`/order-confirmation/${orderId}`);
        } catch (err) {
            console.error('Checkout error:', err);
            toast.error(err.response?.data?.message || err.message || 'Order failed. Your cart is still saved.');
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
                                <input
                                    required
                                    type="text"
                                    value={form.fullName}
                                    onChange={update('fullName')}
                                    placeholder="e.g. Rahul Sharma"
                                    className="input-luxe"
                                />
                            </div>
                            <div>
                                <label className="label-luxe">Phone *</label>
                                <input
                                    required
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                    minLength={10}
                                    pattern="[0-9]{10}"
                                    title="Phone number must be exactly 10 digits"
                                    value={form.phone}
                                    onChange={update('phone')}
                                    placeholder="e.g. 9876543210"
                                    className="input-luxe"
                                />
                            </div>
                            <div>
                                <label className="label-luxe">Email *</label>
                                <input
                                    required
                                    type="email"
                                    value={form.email}
                                    onChange={update('email')}
                                    placeholder="e.g. rahul@example.com"
                                    className="input-luxe"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="label-luxe">Address *</label>
                                <input
                                    required
                                    type="text"
                                    value={form.address}
                                    onChange={update('address')}
                                    placeholder="e.g. Flat 402, Sunshine Apartments, Main Street"
                                    className="input-luxe"
                                />
                            </div>
                            <div>
                                <label className="label-luxe">City *</label>
                                <input
                                    required
                                    type="text"
                                    pattern="[A-Za-z\s]+"
                                    title="City must contain letters only"
                                    value={form.city}
                                    onChange={update('city')}
                                    placeholder="e.g. Mumbai"
                                    className="input-luxe"
                                />
                            </div>
                            <div>
                                <label className="label-luxe">State *</label>
                                <input
                                    required
                                    type="text"
                                    pattern="[A-Za-z\s]+"
                                    title="State must contain letters only"
                                    value={form.state}
                                    onChange={update('state')}
                                    placeholder="e.g. Maharashtra"
                                    className="input-luxe"
                                />
                            </div>
                            <div>
                                <label className="label-luxe">Postal Code *</label>
                                <input
                                    required
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    minLength={6}
                                    pattern="[0-9]{6}"
                                    title="Postal code must be exactly 6 digits"
                                    value={form.postalCode}
                                    onChange={update('postalCode')}
                                    placeholder="e.g. 400001"
                                    className="input-luxe"
                                />
                            </div>
                            <div>
                                <label className="label-luxe">Country *</label>
                                <input
                                    required
                                    type="text"
                                    pattern="[A-Za-z\s]+"
                                    title="Country must contain letters only"
                                    value={form.country}
                                    onChange={update('country')}
                                    placeholder="e.g. India"
                                    className="input-luxe"
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="font-display text-2xl">Payment Method</h2>
                        <div className="mt-6 space-y-3">
                            {[
                                { v: 'online', l: 'Pay Online (Razorpay)', d: 'UPI, Cards, NetBanking, Wallets — 100% Encrypted & Instant' },
                                { v: 'cod', l: 'Cash on Delivery', d: 'Pay with cash upon package delivery' }
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
                        <div className="mt-4 flex items-center gap-2 text-xs text-text-light">
                            <ShieldCheck className="h-4 w-4 text-success" />
                            <span>Payments secured by 256-bit SSL encryption & Razorpay.</span>
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
                        {submitting ? 'Processing Payment…' : (form.paymentMethod === 'online' ? `Pay with Razorpay — ${formatINR(total)}` : 'Place Order')}
                    </button>
                    <p className="mt-3 text-center text-xs text-text-light">
                        Items are reserved safely while completing checkout.
                    </p>
                </aside>
            </form>
        </div>
    );
}

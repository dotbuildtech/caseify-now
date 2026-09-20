'use client';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, X, ShoppingBag, Lock, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/utils/format';
import { FORM_FIELD_LABELS } from '@/utils/constants';
import SmartImage from '@/components/ui/SmartImage';
import { fetchPublicStorePolicy } from '@/services/adminApi';

const DEBOUNCE_MS = 400;

export default function CartPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { items, subtotal, summary, updateItem, removeItem, getItemQty, getItemPrice, getItemProductId, getItemGstRate, getItemImage, getItemName, getItemCategory, getItemAttributes } = useCart();
    const debounceTimers = useRef({});
    const [policy, setPolicy] = useState({ shippingFee: 49, freeShippingThreshold: 500, defaultGstRate: 18 });

    useEffect(() => {
        fetchPublicStorePolicy()
            .then(p => { if (p) setPolicy(p); })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login?redirect=/cart');
        }
    }, [authLoading, user, router]);

    const debouncedUpdate = useCallback((productId, qty) => {
        if (debounceTimers.current[productId]) {
            clearTimeout(debounceTimers.current[productId]);
        }
        debounceTimers.current[productId] = setTimeout(() => {
            updateItem(productId, qty);
            delete debounceTimers.current[productId];
        }, DEBOUNCE_MS);
    }, [updateItem]);

    if (authLoading) {
        return (
            <div className="container-luxe py-20 text-center">
                <p className="text-sm uppercase tracking-[0.18em] text-text-light">Loading...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container-luxe py-20">
                <div className="mx-auto max-w-md border border-dashed border-border bg-surface p-12 text-center">
                    <Lock className="mx-auto h-10 w-10 text-text-light" strokeWidth={1.25} />
                    <h2 className="mt-6 font-display text-3xl">Sign in to view your <span className="italic-display">cart</span>.</h2>
                    <p className="mt-2 text-sm text-text-light">Your bag is saved to your account so it's ready on any device.</p>
                    <Link href="/login?redirect=/cart" className="btn-primary mt-8">Login to Continue</Link>
                    <Link href="/shop" className="btn-ghost mt-3 w-full justify-center">Continue Shopping</Link>
                </div>
            </div>
        );
    }

    const computedSubtotal = subtotal || summary?.subtotal || 0;
    const computedGst = items.reduce((s, i) => {
        const qty = getItemQty(i);
        const price = getItemPrice(i);
        const rate = getItemGstRate(i);
        return s + (qty * price * (rate / 100));
    }, 0);
    const shipping = computedSubtotal === 0 ? 0 : (computedSubtotal >= policy.freeShippingThreshold ? 0 : policy.shippingFee);
    const total = computedSubtotal + computedGst + shipping;
    const remaining = Math.max(0, policy.freeShippingThreshold - computedSubtotal);

    return (
        <div className="container-luxe py-12 md:py-20">
            <div className="mb-10">
                <span className="eyebrow">— Your Bag</span>
                <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl">
                    Your <span className="italic-display">Cart</span>.
                </h1>
            </div>

            {items.length === 0 ? (
                <div className="border border-dashed border-border bg-surface p-12 text-center">
                    <ShoppingBag className="mx-auto h-10 w-10 text-text-light" strokeWidth={1.25} />
                    <h2 className="mt-6 font-display text-3xl">Cart is <span className="italic-display">empty</span>.</h2>
                    <p className="mt-2 text-sm text-text-light">Start shopping and find the perfect case for your device.</p>
                    <Link href="/shop" className="btn-primary mt-8">Continue Shopping</Link>
                </div>
            ) : (
                <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
                    <div>
                        {remaining > 0 && (
                            <div className="mb-6 border border-border bg-background-light p-4 text-sm">
                                Add <span className="font-semibold text-bronze">{formatINR(remaining)}</span> more for <span className="font-semibold">FREE shipping</span>.
                            </div>
                        )}
                        <ul className="divide-y divide-border border-t border-b border-border">
                            {items.map((item) => {
                                const productId = getItemProductId(item);
                                const isCustom = productId === 9999;
                                const qty = getItemQty(item);
                                const price = getItemPrice(item);
                                const lineTotal = qty * price;
                                const img = getItemImage(item);
                                const name = getItemName(item);
                                const category = getItemCategory(item);
                                const key = item.id || productId;
                                return (
                                    <li key={key} className="flex gap-4 py-6">
                                        {isCustom ? (
                                            <div className="relative h-28 w-24 flex-shrink-0 overflow-hidden bg-background-light">
                                                {img && <SmartImage src={img} alt={name} fill sizes="120px" className="object-cover" />}
                                            </div>
                                        ) : (
                                            <Link href={`/product/${productId}`} className="block relative h-28 w-24 flex-shrink-0 overflow-hidden bg-background-light">
                                                <SmartImage src={img} alt={name} fill sizes="120px" className="object-cover" />
                                            </Link>
                                        )}
                                        <div className="flex flex-1 flex-col">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    {isCustom ? (
                                                        <span className="text-sm font-medium text-ink">{name}</span>
                                                    ) : (
                                                        <Link href={`/product/${productId}`} className="text-sm font-medium text-ink hover:text-bronze">{name}</Link>
                                                    )}
                                                    <p className="mt-1 text-xs text-text-light">{category}</p>
                                                {(() => {
                                                    const attrs = getItemAttributes(item);
                                                    const entries = Object.entries(attrs).filter(([, v]) => v);
                                                    if (!entries.length) return null;
                                                    return (
                                                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-text-light">
                                                            {entries.map(([k, v]) => {
                                                                const label = FORM_FIELD_LABELS[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                                                                return <span key={k}>{label}: <span className="text-ink font-medium">{v}</span></span>;
                                                            })}
                                                        </div>
                                                    );
                                                })()}
                                                </div>
                                                <button onClick={() => removeItem(productId)} className="text-text-light hover:text-error shrink-0" aria-label="Remove">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="mt-auto flex items-end justify-between gap-3">
                                                {isCustom ? (
                                                    <span className="h-9 text-xs text-text-light leading-[2.25rem] italic">Custom design</span>
                                                ) : (
                                                    <div className="inline-flex items-center border border-border">
                                                        <button
                                                            onClick={() => debouncedUpdate(productId, Math.max(1, qty - 1))}
                                                            className="h-9 w-9 text-ink hover:bg-background-light"
                                                        >
                                                            <Minus className="h-3 w-3 mx-auto" />
                                                        </button>
                                                        <span className="h-9 w-10 text-center text-sm font-semibold tabular-nums leading-[2.25rem]">{qty}</span>
                                                        <button
                                                            onClick={() => debouncedUpdate(productId, Math.min(99, qty + 1))}
                                                            className="h-9 w-9 text-ink hover:bg-background-light"
                                                        >
                                                            <Plus className="h-3 w-3 mx-auto" />
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="text-right shrink-0">
                                                    {(() => {
                                                        const cap = item.Product?.compareAtPrice;
                                                        const itemGst = getItemGstRate(item);
                                                        if (cap && Number(cap) > price) {
                                                            const pct = Math.round((1 - price / Number(cap)) * 100);
                                                            return (
                                                                <>
                                                                    <p className="text-xs text-text-light line-through tabular-nums">{formatINR(cap)}</p>
                                                                    <p className="text-sm font-semibold tabular-nums">{formatINR(lineTotal)}</p>
                                                                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                                                        <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-bronze">-{pct}%</span>
                                                                        <span className="text-[10px] text-text-light font-medium bg-background-light px-1.5 py-0.5 rounded">+{itemGst}% GST</span>
                                                                    </div>
                                                                </>
                                                            );
                                                        }
                                                        return (
                                                            <>
                                                                <p className="text-sm font-semibold tabular-nums">{formatINR(lineTotal)}</p>
                                                                <span className="inline-block mt-0.5 text-[10px] text-text-light font-medium bg-background-light px-1.5 py-0.5 rounded">+{itemGst}% GST</span>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <aside className="h-fit border border-border bg-surface p-6 md:p-8 rounded-xl shadow-sm">
                        <h2 className="font-display text-2xl">Order Summary</h2>
                        <dl className="mt-6 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-text-light">Bag Subtotal</dt>
                                <dd className="font-medium tabular-nums">{formatINR(computedSubtotal)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-text-light flex items-center gap-1.5">
                                    <span>Estimated GST</span>
                                    <span className="text-[10px] text-text-light/70 font-mono">(Product-wise)</span>
                                </dt>
                                <dd className="font-medium tabular-nums text-ink">{formatINR(computedGst)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-text-light">Shipping</dt>
                                <dd className="font-medium tabular-nums">
                                    {shipping === 0 ? (
                                        <span className="text-emerald-700 font-semibold uppercase tracking-wider text-xs">Free</span>
                                    ) : (
                                        formatINR(shipping)
                                    )}
                                </dd>
                            </div>
                            <div className="flex justify-between border-t border-border pt-3">
                                <dt className="font-display text-lg">Total Amount</dt>
                                <dd className="font-display text-2xl font-semibold tabular-nums text-ink">{formatINR(total)}</dd>
                            </div>
                        </dl>
                        <Link href="/checkout" prefetch={true} className="btn-primary mt-6 w-full">Proceed to Checkout</Link>
                        <Link href="/shop" className="btn-ghost mt-3 w-full justify-center">Continue Shopping</Link>
                    </aside>
                </div>
            )}
        </div>
    );
}

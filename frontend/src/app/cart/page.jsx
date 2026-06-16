'use client';
import Link from 'next/link';
import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, X, ShoppingBag, Lock } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/utils/format';
import SmartImage from '@/components/ui/SmartImage';

const SHIPPING_THRESHOLD = 500;
const SHIPPING_FEE = 49;
const DEBOUNCE_MS = 400;

export default function CartPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { items, subtotal, summary, updateItem, removeItem, getItemQty, getItemPrice, getItemProductId, getItemImage, getItemName, getItemCategory } = useCart();
    const debounceTimers = useRef({});

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
    const shipping = computedSubtotal === 0 ? 0 : computedSubtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = computedSubtotal + shipping;
    const remaining = Math.max(0, SHIPPING_THRESHOLD - computedSubtotal);

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
                                                <p className="text-sm font-semibold tabular-nums">{formatINR(lineTotal)}</p>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <aside className="h-fit border border-border bg-surface p-6 md:p-8">
                        <h2 className="font-display text-2xl">Order Summary</h2>
                        <dl className="mt-6 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-text-light">Items</dt>
                                <dd className="font-medium tabular-nums">{formatINR(computedSubtotal)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-text-light">Shipping</dt>
                                <dd className="font-medium tabular-nums">{shipping === 0 ? 'Free' : formatINR(shipping)}</dd>
                            </div>
                            <div className="flex justify-between border-t border-border pt-3">
                                <dt className="font-display text-lg">Total</dt>
                                <dd className="font-display text-2xl font-semibold tabular-nums">{formatINR(total)}</dd>
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

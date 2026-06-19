'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, ShoppingBag, Minus, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/utils/format';
import { FORM_FIELD_LABELS } from '@/utils/constants';
import SmartImage from '@/components/ui/SmartImage';

export default function CartDrawer() {
    const router = useRouter();
    const {
        items, count, subtotal, summary, drawerOpen, setDrawerOpen,
        updateItem, removeItem, getItemQty, getItemPrice,
        getItemProductId, getItemImage, getItemName, getItemCategory, getItemAttributes
    } = useCart();

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') setDrawerOpen(false);
        };
        if (drawerOpen) {
            document.addEventListener('keydown', handler);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [drawerOpen, setDrawerOpen]);

    const computedSubtotal = subtotal || summary?.subtotal || 0;

    return (
        <>
            {drawerOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm"
                    onClick={() => setDrawerOpen(false)}
                />
            )}
            <div
                className={`fixed top-0 right-0 z-[110] h-full w-full max-w-md border-l border-border bg-surface shadow-xl transition-transform duration-300 ${
                    drawerOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex h-16 items-center justify-between border-b border-border px-6">
                    <h2 className="font-display text-xl">
                        Cart <span className="text-text-light text-sm font-sans">({count})</span>
                    </h2>
                    <button
                        onClick={() => setDrawerOpen(false)}
                        className="flex h-8 w-8 items-center justify-center border border-border hover:bg-background-light transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[calc(100%-4rem)] px-6 text-center">
                        <ShoppingBag className="h-10 w-10 text-text-light" strokeWidth={1.25} />
                        <p className="mt-4 font-display text-2xl">Cart is <span className="italic-display">empty</span>.</p>
                        <p className="mt-2 text-sm text-text-light">Find the perfect case for your device.</p>
                        <button
                            onClick={() => { setDrawerOpen(false); router.push('/shop'); }}
                            className="btn-primary mt-6"
                        >
                            Shop Now
                        </button>
                    </div>
                ) : (
                    <div className="flex h-[calc(100%-4rem)] flex-col">
                        <ul className="flex-1 overflow-y-auto divide-y divide-border">
                            {items.map((item) => {
                                const productId = getItemProductId(item);
                                const qty = getItemQty(item);
                                const price = getItemPrice(item);
                                const lineTotal = qty * price;
                                const img = getItemImage(item);
                                const name = getItemName(item);
                                const category = getItemCategory(item);
                                const key = item.id || productId;
                                return (
                                    <li key={key} className="flex gap-4 px-6 py-5">
                                        <Link
                                            href={`/product/${productId}`}
                                            onClick={() => setDrawerOpen(false)}
                                            className="block relative h-24 w-20 flex-shrink-0 overflow-hidden bg-background-light"
                                        >
                                            <SmartImage src={img} alt={name} fill sizes="80px" className="object-cover" />
                                        </Link>
                                        <div className="flex flex-1 flex-col min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <Link
                                                    href={`/product/${productId}`}
                                                    onClick={() => setDrawerOpen(false)}
                                                    className="text-sm font-medium text-ink hover:text-bronze truncate"
                                                >
                                                    {name}
                                                </Link>
                                                <button
                                                    onClick={() => removeItem(productId)}
                                                    className="text-text-light hover:text-error shrink-0"
                                                    aria-label="Remove"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <p className="mt-0.5 text-xs text-text-light truncate">{category}</p>
                                            {(() => {
                                                const attrs = getItemAttributes(item);
                                                const entries = Object.entries(attrs).filter(([, v]) => v);
                                                if (!entries.length) return null;
                                                return (
                                                    <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-text-light">
                                                        {entries.map(([k, v]) => {
                                                            const label = FORM_FIELD_LABELS[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                                                            return <span key={k}>{label}: <span className="text-ink font-medium">{v}</span></span>;
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                            <div className="mt-auto flex items-end justify-between gap-2">
                                                <div className="inline-flex items-center border border-border">
                                                    <button
                                                        onClick={() => updateItem(productId, Math.max(1, qty - 1))}
                                                        className="h-7 w-7 text-ink hover:bg-background-light"
                                                    >
                                                        <Minus className="h-3 w-3 mx-auto" />
                                                    </button>
                                                    <span className="h-7 w-8 text-center text-xs font-semibold tabular-nums leading-[1.75rem]">{qty}</span>
                                                    <button
                                                        onClick={() => updateItem(productId, Math.min(99, qty + 1))}
                                                        className="h-7 w-7 text-ink hover:bg-background-light"
                                                    >
                                                        <Plus className="h-3 w-3 mx-auto" />
                                                    </button>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    {(() => {
                                                        const cap = item.Product?.compareAtPrice;
                                                        if (cap && Number(cap) > price) {
                                                            const pct = Math.round((1 - price / Number(cap)) * 100);
                                                            return (
                                                                <>
                                                                    <p className="text-xs text-text-light line-through tabular-nums">{formatINR(cap)}</p>
                                                                    <p className="text-sm font-semibold tabular-nums">{formatINR(lineTotal)}</p>
                                                                    <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-bronze">-{pct}%</p>
                                                                </>
                                                            );
                                                        }
                                                        return <p className="text-sm font-semibold tabular-nums">{formatINR(lineTotal)}</p>;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="border-t border-border p-6 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-light">Subtotal</span>
                                <span className="font-semibold tabular-nums">{formatINR(computedSubtotal)}</span>
                            </div>
                            <Link
                                href="/cart"
                                onClick={() => setDrawerOpen(false)}
                                className="btn-primary w-full justify-center"
                            >
                                View Full Cart
                            </Link>
                            <Link
                                href="/checkout"
                                onClick={() => setDrawerOpen(false)}
                                className="btn-ghost w-full justify-center"
                            >
                                Checkout
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

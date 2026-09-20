'use client';
import { memo } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';
import { formatINR } from '@/utils/format';
import SmartImage from '@/components/ui/SmartImage';

export const getProductImage = (p) => {
    if (!p) return '';
    if (Array.isArray(p.images) && p.images.length) {
        const first = p.images[0];
        return typeof first === 'string' ? first : first?.url;
    }
    return p.image || p.image_url || '';
};

export const getProductPrice = (p) => {
    if (!p) return 0;
    return Number(p.price) || 0;
};

export const getProductOriginalPrice = (p) => {
    if (!p) return null;
    const cap = p.compareAtPrice ?? p.discount_price;
    return cap && Number(cap) > Number(p.price) ? Number(cap) : null;
};

export const getProductDiscountPercent = (p) => {
    const original = getProductOriginalPrice(p);
    if (!original) return null;
    return Math.round((1 - Number(p.price) / original) * 100);
};

export default memo(function ProductCard({ p }) {
    const sale = getProductPrice(p);
    const original = getProductOriginalPrice(p);
    const discount = getProductDiscountPercent(p);
    const img = getProductImage(p);
    const outOfStock = p.stock != null && p.stock <= 0;
    const gstRate = p.gstRate != null ? Number(p.gstRate) : 18;

    return (
        <Link
            href={`/product/${p.slug || p.id}`}
            className="group block relative rounded-2xl border border-border/70 bg-surface p-3 transition-all duration-300 hover:border-ink/30 hover:shadow-xl hover:shadow-black/[0.04]"
        >
            {/* Image Container with Luxury Badges */}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-background-light">
                <SmartImage
                    src={img}
                    alt={p.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Badges */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
                    {discount && (
                        <span className="inline-flex items-center rounded-md bg-bronze px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cream shadow-sm">
                            -{discount}%
                        </span>
                    )}
                    {outOfStock && (
                        <span className="inline-flex items-center rounded-md bg-ink/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-cream shadow-sm">
                            Sold Out
                        </span>
                    )}
                </div>

                {p.brand && (
                    <span className="absolute top-2.5 right-2.5 z-10 rounded-md bg-surface/90 backdrop-blur-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-ink border border-border/60 shadow-sm">
                        {p.brand}
                    </span>
                )}

                {/* Hover Quick View Overlay */}
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/15 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-ink shadow-lg transform translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
                        <span>View Details</span>
                        <ArrowUpRight size={14} />
                    </span>
                </div>
            </div>

            {/* Content & Clear Pricing Details */}
            <div className="mt-3.5 px-1 pb-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate font-display text-sm font-medium text-ink transition-colors group-hover:text-bronze">
                            {p.name}
                        </h3>
                        <p className="mt-0.5 truncate text-[11px] uppercase tracking-[0.14em] text-text-light font-medium">
                            {p.category || 'Atelier'} {p.phoneModel ? `• ${p.phoneModel}` : ''}
                        </p>
                    </div>
                </div>

                {/* Price & GST Transparency Block */}
                <div className="mt-3 pt-2.5 border-t border-border/50 flex items-end justify-between">
                    <div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-semibold tabular-nums text-ink">
                                {formatINR(sale)}
                            </span>
                            {original && (
                                <span className="text-xs text-text-light/70 line-through tabular-nums">
                                    {formatINR(original)}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 bg-background-light/80 border border-border/60 text-[10px] font-medium tracking-tight text-text-light">
                            +{gstRate}% GST
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
});

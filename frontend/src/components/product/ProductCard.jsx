'use client';
import { memo } from 'react';
import Link from 'next/link';
import { ShoppingBag, Package } from 'lucide-react';
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
    return (
        <Link href={`/product/${p.slug || p.id}`} className="group block">
            <div className="relative aspect-[3/4] overflow-hidden bg-background-light border border-border">
                <SmartImage
                    src={img}
                    alt={p.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {discount && (
                    <span className="absolute left-3 top-3 z-10 bg-bronze px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-cream">
                        -{discount}%
                    </span>
                )}
                {outOfStock && (
                    <span className="absolute left-3 bottom-3 z-10 bg-ink/80 px-2 py-1 text-[10px] font-medium text-cream">
                        Out of Stock
                    </span>
                )}
                {p.brand && (
                    <span className="absolute right-3 bottom-3 z-10 bg-cream/90 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-ink font-medium">
                        {p.brand}
                    </span>
                )}
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/0 opacity-0 transition-all duration-500 group-hover:bg-ink/10 group-hover:opacity-100">
                    <span className="flex h-10 w-10 items-center justify-center bg-cream text-ink shadow-sm">
                        <ShoppingBag className="h-4 w-4" />
                    </span>
                </div>
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium leading-tight text-ink group-hover:text-bronze transition-colors">{p.name}</h3>
                    <p className="mt-0.5 truncate text-[11px] text-text-light">{p.category}</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums text-ink">{formatINR(sale)}</p>
                    {original && (
                        <p className="text-xs text-text-light line-through tabular-nums">{formatINR(original)}</p>
                    )}
                </div>
            </div>
        </Link>
    );
});

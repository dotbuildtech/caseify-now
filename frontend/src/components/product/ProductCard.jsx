'use client';
import { memo } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
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
    const sale = p.compareAtPrice ?? p.discount_price;
    return sale && sale < p.price ? sale : p.price;
};

export const getProductOriginalPrice = (p) => {
    if (!p) return null;
    const sale = p.compareAtPrice ?? p.discount_price;
    return sale && sale < p.price ? p.price : null;
};

export default memo(function ProductCard({ p }) {
    const sale = getProductPrice(p);
    const original = getProductOriginalPrice(p);
    const discount = original ? Math.round((1 - sale / original) * 100) : null;
    const img = getProductImage(p);
    return (
        <Link href={`/product/${p.slug || p.id}`} className="group block">
            <div className="relative aspect-[3/4] overflow-hidden bg-background-light">
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
                <div className="absolute right-3 top-3 z-10 flex h-9 w-9 translate-x-12 items-center justify-center bg-cream text-ink opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
                    <ShoppingBag className="h-4 w-4" />
                </div>
            </div>
            <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium leading-tight text-ink group-hover:text-bronze">{p.name}</h3>
                    <p className="mt-1 text-xs text-text-light">{p.category}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-ink">{formatINR(sale)}</p>
                    {original && (
                        <p className="text-xs text-text-light line-through tabular-nums">{formatINR(original)}</p>
                    )}
                </div>
            </div>
        </Link>
    );
});

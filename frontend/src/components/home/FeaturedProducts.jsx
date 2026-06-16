'use client';
import Link from 'next/link';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';
import { formatINR } from '@/utils/format';
import SmartImage from '@/components/ui/SmartImage';

function ProductCard({ p }) {
    const sale = p.compareAtPrice && p.compareAtPrice < p.price ? p.compareAtPrice : p.price;
    const original = p.compareAtPrice && p.compareAtPrice < p.price ? p.price : null;
    const discount = original ? Math.round((1 - sale / original) * 100) : null;
    const img = Array.isArray(p.images) && p.images.length
        ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.url)
        : (p.image || '');
    return (
        <Link href={`/product/${p.slug || p.id}`} className="group block">
            <div className="relative aspect-[3/4] overflow-hidden bg-background-light">
                <SmartImage
                    src={img}
                    alt={p.name}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 20vw"
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
}

export default function FeaturedProducts({ products = [] }) {
    return (
        <section className="bg-surface py-20 md:py-28">
            <div className="container-luxe">
                <div className="mb-12 flex items-end justify-between gap-6 md:mb-16">
                    <div>
                        <span className="eyebrow">— Best Sellers</span>
                        <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl">
                            Products customers<br />
                            <span className="italic-display">love</span>.
                        </h2>
                        <p className="mt-4 max-w-md text-sm text-text-light">
                            Handpicked bestsellers trusted by thousands. Premium quality, affordable prices.
                        </p>
                    </div>
                    <Link href="/shop" className="hidden md:inline-flex btn-ghost">
                        View all <ArrowUpRight className="h-3 w-3" />
                    </Link>
                </div>

                {products.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
                        {products.slice(0, 5).map((p) => <ProductCard key={p.id || p.slug} p={p} />)}
                    </div>
                ) : (
                    <div className="border border-dashed border-border bg-background-light p-12 text-center">
                        <p className="text-sm text-text-light">No featured products yet. Add some via the admin panel.</p>
                    </div>
                )}
            </div>
        </section>
    );
}

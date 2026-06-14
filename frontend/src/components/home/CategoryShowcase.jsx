'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import api from '@/services/api';
import { fetchProducts } from '@/services/productApi';
import SmartImage from '@/components/ui/SmartImage';

export default function CategoryShowcase() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const catRes = await api.get('/categories');
                const categories = catRes.data?.data || [];
                if (!Array.isArray(categories) || !categories.length) {
                    if (mounted) setLoading(false);
                    return;
                }

                const results = await Promise.allSettled(
                    categories.map((cat) =>
                        fetchProducts({ category: cat.name, limit: 1, sort: '-createdAt' })
                    )
                );

                if (!mounted) return;

                const data = results.map((r, i) => {
                    const cat = categories[i];
                    if (r.status === 'fulfilled' && r.value.data?.length) {
                        const p = r.value.data[0];
                        const img = Array.isArray(p.images) && p.images.length
                            ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.url)
                            : (p.image || '');
                        return { category: cat, image: img, name: cat.name, slug: cat.slug };
                    }
                    return { category: cat, image: null, name: cat.name, slug: cat.slug };
                });

                setItems(data.filter((it) => it.image));
                setLoading(false);
            } catch {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => { mounted = false; };
    }, []);

    if (loading) {
        return (
            <section className="bg-background pt-24 pb-28 md:pt-32 md:pb-36">
                <div className="container-luxe">
                    <div className="mb-12 text-center md:mb-20">
                        <span className="eyebrow">— Browse Categories</span>
                        <h2 className="mt-4 mx-auto max-w-3xl font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl lg:text-7xl">
                            Find the perfect case<br />
                            <span className="italic-display">for your phone</span>.
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="aspect-[4/5] animate-pulse bg-background-light" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (!items.length) return null;

    return (
        <section className="bg-background pt-24 pb-28 md:pt-32 md:pb-36">
            <div className="container-luxe">
                <div className="mb-12 text-center md:mb-20">
                    <span className="eyebrow">— Browse Categories</span>
                    <h2 className="mt-4 mx-auto max-w-3xl font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl lg:text-7xl">
                        Find the perfect case<br />
                        <span className="italic-display">for your phone</span>.
                    </h2>
                    <p className="mt-6 mx-auto max-w-xl text-sm text-text-light md:text-base">
                        Explore our curated collections. Each category showcases our finest design — tap to discover more.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item, i) => (
                        <Link
                            key={item.category.id}
                            href={`/shop?category=${encodeURIComponent(item.name)}`}
                            className="group relative block"
                        >
                            <div className="relative aspect-[4/5] overflow-hidden border border-border/50">
                                <SmartImage
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    priority={i < 3}
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    className="object-cover transition-all duration-1000 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent opacity-90 transition-opacity duration-700 group-hover:opacity-95" />
                            </div>

                            <div className="absolute inset-x-0 bottom-0 z-10 p-5 md:p-7">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-cream/50">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <h3 className="mt-2 font-display text-2xl leading-tight tracking-editorial text-cream md:text-3xl">
                                            {item.name}
                                        </h3>
                                    </div>
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-cream/20 text-cream opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:border-cream/50 -translate-y-2 group-hover:translate-y-0">
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-12 text-center md:mt-16">
                    <Link href="/shop" className="btn-primary group">
                        View all categories
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}

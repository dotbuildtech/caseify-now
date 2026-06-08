'use client';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import SmartImage from '@/components/ui/SmartImage';

const CATEGORIES = [
    { name: 'iPhone Cases', slug: 'iPhone Cases', image: 'https://images.unsplash.com/photo-1526738549149-8e07ead6a224?auto=format&fit=crop&w=600&q=70' },
    { name: 'Android Cases', slug: 'Android Cases', image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=600&q=70' },
    { name: 'Screen Protection', slug: 'Screen Protection', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=70' },
    { name: 'Accessories', slug: 'Accessories', image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=600&q=70' },
    { name: 'Mounts', slug: 'Mounts', image: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?auto=format&fit=crop&w=600&q=70' },
    { name: 'Cables & Chargers', slug: 'Cables & Chargers', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=70' }
];

export default function CategoriesSection() {
    return (
        <section className="bg-background py-20 md:py-28">
            <div className="container-luxe">
                <div className="mb-12 flex items-end justify-between gap-6 md:mb-16">
                    <div>
                        <span className="eyebrow">— Browse Categories</span>
                        <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl">
                            Find the perfect case<br />
                            <span className="italic-display">for your phone</span>.
                        </h2>
                    </div>
                    <Link href="/shop" className="hidden md:inline-flex btn-ghost">
                        View all categories <ArrowUpRight className="h-3 w-3" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                    {CATEGORIES.map((c, i) => (
                        <Link
                            key={c.name}
                            href={`/shop?category=${encodeURIComponent(c.slug)}`}
                            className="group relative block aspect-[3/4] overflow-hidden bg-background-light"
                        >
                            <SmartImage
                                src={c.image}
                                alt={c.name}
                                fill
                                sizes="(max-width: 768px) 50vw, 33vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 z-10 p-4 text-cream md:p-6">
                                <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-cream/60">0{i + 1}</span>
                                <h3 className="mt-2 font-display text-2xl leading-tight md:text-3xl">{c.name}</h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

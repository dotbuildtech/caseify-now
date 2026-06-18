'use client';
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Marquee from '@/components/home/Marquee';
import Reveal from '@/components/ui/Reveal';

const HeroSlider = dynamic(() => import('@/components/home/HeroSlider'), {
    loading: () => <div className="h-[70vh] min-h-[500px] bg-ink animate-pulse" />
});
const CategoryShowcase = dynamic(() => import('@/components/home/CategoryShowcase'), {
    loading: () => (
        <section className="bg-background pt-24 pb-28 md:pt-32 md:pb-36">
            <div className="container-luxe">
                <div className="mb-12 text-center md:mb-20">
                    <span className="eyebrow">— Browse Categories</span>
                    <h2 className="mt-4 mx-auto max-w-3xl font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl lg:text-7xl">Loading...</h2>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-[4/5] animate-pulse bg-background-light" />
                    ))}
                </div>
            </div>
        </section>
    )
});
const FeaturedProducts = dynamic(() => import('@/components/home/FeaturedProducts'), {
    loading: () => (
        <section className="bg-surface py-20 md:py-28">
            <div className="container-luxe">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i}>
                            <div className="aspect-[3/4] bg-background-light animate-pulse" />
                            <div className="mt-4 h-4 w-2/3 bg-background-light animate-pulse" />
                            <div className="mt-2 h-3 w-1/3 bg-background-light animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
});
const QuoteBlock = dynamic(() => import('@/components/home/QuoteBlock'));
const ValuesGrid = dynamic(() => import('@/components/home/ValuesGrid'));
const Testimonials = dynamic(() => import('@/components/home/Testimonials'));
const CTABlock = dynamic(() => import('@/components/home/CTABlock'));

const FETCH_TIMEOUT = 25000;

async function fetchHomepageData(signal) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    signal?.addEventListener('abort', () => controller.abort());
    try {
        const res = await fetch('/api/homepage', { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
    } finally {
        clearTimeout(timeoutId);
    }
}

export default function HomePageClient({ initialData }) {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(!initialData);
    const mountedRef = useRef(true);

    useEffect(() => {
        if (initialData) return;
        const controller = new AbortController();
        setLoading(true);
        fetchHomepageData(controller.signal)
            .then((d) => {
                if (mountedRef.current) setData(d);
            })
            .catch(() => {
                if (mountedRef.current) setData({ heroSlides: [], categories: [], featuredProducts: [] });
            })
            .finally(() => {
                if (mountedRef.current) setLoading(false);
            });
        return () => { mountedRef.current = false; controller.abort(); };
    }, []);

    return (
        <>
            {loading && !initialData ? (
                <>
                    <div className="h-[70vh] min-h-[500px] bg-ink animate-pulse" />
                    <Reveal><Marquee /></Reveal>
                    <div className="bg-background pt-24 pb-28 md:pt-32 md:pb-36">
                        <div className="container-luxe">
                            <div className="mb-12 text-center md:mb-20">
                                <span className="eyebrow">— Browse Categories</span>
                                <h2 className="mt-4 mx-auto max-w-3xl font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl lg:text-7xl">Loading...</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="aspect-[4/5] animate-pulse bg-background-light" />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="bg-surface py-20 md:py-28">
                        <div className="container-luxe">
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i}>
                                        <div className="aspect-[3/4] bg-background-light animate-pulse" />
                                        <div className="mt-4 h-4 w-2/3 bg-background-light animate-pulse" />
                                        <div className="mt-2 h-3 w-1/3 bg-background-light animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <QuoteBlock />
                    <ValuesGrid />
                    <Testimonials />
                    <CTABlock />
                </>
            ) : (
                <>
                    <HeroSlider slides={data.heroSlides || []} />
                    <Reveal><Marquee /></Reveal>
                    <Reveal delay={0.1}><CategoryShowcase categories={data.categories || []} /></Reveal>
                    <Reveal delay={0.1}><FeaturedProducts products={data.featuredProducts || []} /></Reveal>
                    <Reveal delay={0.1}><QuoteBlock /></Reveal>
                    <Reveal delay={0.1}><ValuesGrid /></Reveal>
                    <Reveal delay={0.1}><Testimonials /></Reveal>
                    <Reveal delay={0.1}><CTABlock /></Reveal>
                </>
            )}
        </>
    );
}

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
                    <h2 className="mt-4 mx-auto max-w-3xl font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl lg:text-7xl">
                        Loading...
                    </h2>
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const revalidate = 300;

async function getHomepageData() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`${API_BASE}/api/homepage`, {
            next: { revalidate: 300 },
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
    } catch {
        return { heroSlides: [], categories: [], featuredProducts: [] };
    }
}

export default async function HomePage() {
    const data = await getHomepageData();

    return (
        <>
            <HeroSlider slides={data.heroSlides} />
            <Reveal><Marquee /></Reveal>
            <Reveal delay={0.1}><CategoryShowcase categories={data.categories} /></Reveal>
            <Reveal delay={0.1}><FeaturedProducts products={data.featuredProducts} /></Reveal>
            <Reveal delay={0.1}><QuoteBlock /></Reveal>
            <Reveal delay={0.1}><ValuesGrid /></Reveal>
            <Reveal delay={0.1}><Testimonials /></Reveal>
            <Reveal delay={0.1}><CTABlock /></Reveal>
        </>
    );
}

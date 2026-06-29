import Link from 'next/link';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import SmartImage from '@/components/ui/SmartImage';

const CARD_SIZES = [
    'aspect-[3/4]',
    'aspect-[4/5]',
    'aspect-square',
    'aspect-[5/7]',
    'aspect-[4/3]',
    'aspect-[3/4]',
    'aspect-square',
    'aspect-[5/7]',
    'aspect-[4/5]',
];

export default function CategoryShowcase({ categories = [] }) {
    if (!categories.length) return null;

    return (
        <section className="bg-background pt-28 pb-32 md:pt-36 md:pb-40">
            <div className="container-luxe">
                <div className="mb-14 text-center md:mb-20">
                    <span className="eyebrow">— Browse Categories</span>
                    <h2 className="mt-5 mx-auto max-w-3xl font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl lg:text-7xl">
                        Explore Our Collection<br />
                        <span className="italic-display">Everything your devices need</span>.
                    </h2>
                    <p className="mt-5 mx-auto max-w-xl text-sm text-text-light md:text-base">
                        Each category is curated for quality and style — find your perfect match.
                    </p>
                </div>

                <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [&>*]:mb-6">
                    {categories.map((cat, i) => {
                        const sizeClass = CARD_SIZES[i % CARD_SIZES.length];
                        return (
                            <Link
                                key={cat.slug || i}
                                href={`/shop?category=${encodeURIComponent(cat.name)}`}
                                className="group relative block break-inside-avoid overflow-hidden bg-background-light"
                                style={{ perspective: '1000px' }}
                            >
                                <div className={`relative ${sizeClass} overflow-hidden`}>
                                    <SmartImage
                                        src={cat.image}
                                        alt={cat.name}
                                        fill
                                        priority={i < 3}
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-[2deg]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/95 via-ink/30 to-transparent opacity-85 transition-opacity duration-700 group-hover:opacity-95" />
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-tr from-transparent via-cream/[0.07] to-transparent" />
                                    <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-y-2 group-hover:translate-y-0">
                                        <span className="inline-flex items-center justify-center w-10 h-10 backdrop-blur-md bg-cream/10 border border-cream/20 text-cream text-xs font-mono tracking-wider">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                    </div>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 z-10">
                                    <div className="backdrop-blur-sm bg-gradient-to-t from-[#050505]/80 to-transparent pt-12 px-6 pb-6 md:px-8 md:pb-8 lg:px-10 lg:pb-10">
                                        <div className="flex items-end justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-cream/60 block mb-1">
                                                    Collection
                                                </span>
                                                <h3 className="font-elegant text-2xl leading-tight tracking-editorial text-cream md:text-3xl lg:text-4xl drop-shadow-xl">
                                                    {cat.name}
                                                </h3>
                                            </div>
                                            <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-cream/10 backdrop-blur-md border border-cream/20 text-cream opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                                                <ArrowRight className="h-5 w-5" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-bronze to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out origin-left z-20" />
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-14 text-center md:mt-18">
                    <Link href="/shop" className="btn-primary group">
                        View all categories
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}

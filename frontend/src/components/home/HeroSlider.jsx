'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SmartImage from '@/components/ui/SmartImage';

export default function HeroSlider({ slides = [] }) {
    const [i, setI] = useState(0);
    const [animKey, setAnimKey] = useState(0);
    const slidesLenRef = useRef(0);
    slidesLenRef.current = slides.length;

    useEffect(() => {
        setAnimKey((k) => k + 1);
    }, [i]);

    const next = useCallback(() => setI((p) => (p + 1) % (slidesLenRef.current || 1)), []);
    const prev = useCallback(() => setI((p) => (p - 1 + slidesLenRef.current) % (slidesLenRef.current || 1)), []);

    useEffect(() => {
        if (slides.length < 2) return;
        const t = setInterval(next, 6000);
        return () => clearInterval(t);
    }, [next, slides.length]);

    const slide = slides[i];

    if (!slide) return null;

    return (
        <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden bg-ink text-cream">
            {slides.map((s, idx) => (
                <div
                    key={s.id || idx}
                    className="absolute inset-0 transition-opacity duration-1000 ease-out"
                    style={{ opacity: idx === i ? 1 : 0 }}
                >
                    <SmartImage
                        src={s.bg}
                        alt={s.title}
                        fill
                        priority={idx === 0}
                        sizes="100vw"
                        quality={85}
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-ink/20 to-transparent" />
                </div>
            ))}

            <div key={animKey} className="relative z-10 container-luxe flex h-full flex-col justify-center pb-20 md:pb-28">
                <span className="eyebrow text-cream/50 animate-slideUp" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                    — Latest Collection
                </span>
                <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[0.92] tracking-editorial md:text-7xl lg:text-8xl animate-slideUp" style={{ animationDelay: '0.35s', animationFillMode: 'both' }}>
                    {slide.title.split(' ').map((w, j) => (
                        <span key={j} className={j % 3 === 2 ? 'italic-display' : ''}>
                            {w}{' '}
                        </span>
                    ))}
                </h1>
                {slide.subtitle && (
                    <p className="mt-6 max-w-xl text-base text-cream/60 md:text-lg animate-slideUp" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
                        {slide.subtitle}
                    </p>
                )}
                <div className="mt-10 flex flex-wrap items-center gap-4 animate-slideUp" style={{ animationDelay: '0.65s', animationFillMode: 'both' }}>
                    <Link
                        href={slide.ctaLink}
                        className="btn-primary !bg-cream !border-cream !text-ink hover:!bg-bronze hover:!border-bronze hover:!text-cream"
                    >
                        {slide.ctaText}
                    </Link>
                    <Link
                        href="/customize"
                        className="btn-secondary !border-cream/30 !text-cream hover:!bg-cream hover:!text-ink"
                    >
                        Design Yours
                    </Link>
                </div>
            </div>

            {slides.length > 1 && (
                <>
                    <div className="absolute bottom-8 right-5 z-20 flex items-center gap-2 sm:right-8">
                        <button
                            onClick={prev}
                            className="flex h-11 w-11 items-center justify-center border border-cream/20 text-cream/60 transition-all duration-300 hover:border-cream hover:bg-cream hover:text-ink"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={next}
                            className="flex h-11 w-11 items-center justify-center border border-cream/20 text-cream/60 transition-all duration-300 hover:border-cream hover:bg-cream hover:text-ink"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="absolute bottom-8 left-5 z-20 flex items-center gap-2 sm:left-8">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setI(idx)}
                                className={`h-1 transition-all duration-500 ${
                                    idx === i ? 'w-10 bg-cream' : 'w-4 bg-cream/20 hover:bg-cream/50'
                                }`}
                                aria-label={`Slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}

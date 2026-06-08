'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HERO_SLIDES } from '@/utils/constants';
import SmartImage from '@/components/ui/SmartImage';

export default function HeroSlider() {
    const [i, setI] = useState(0);

    const next = useCallback(() => setI((p) => (p + 1) % HERO_SLIDES.length), []);
    const prev = useCallback(() => setI((p) => (p - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), []);

    useEffect(() => {
        const t = setInterval(next, 6000);
        return () => clearInterval(t);
    }, [next]);

    const slide = HERO_SLIDES[i];

    return (
        <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden bg-ink text-cream">
            {HERO_SLIDES.map((s, idx) => (
                <div
                    key={idx}
                    className="absolute inset-0 transition-opacity duration-1000"
                    style={{ opacity: idx === i ? 1 : 0 }}
                >
                    <SmartImage
                        src={s.bg}
                        alt={s.title}
                        fill
                        priority={idx === 0}
                        sizes="100vw"
                        quality={75}
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                </div>
            ))}

            <div className="relative z-10 container-luxe flex h-full flex-col justify-end pb-16 md:pb-24">
                <span className="eyebrow text-cream/70">— Latest Collection</span>
                <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[0.95] tracking-editorial md:text-7xl lg:text-8xl">
                    {slide.title.split(' ').map((w, j) => (
                        <span key={j} className={j % 3 === 2 ? 'italic-display' : ''}>{w} </span>
                    ))}
                </h1>
                <p className="mt-6 max-w-xl text-base text-cream/80 md:text-lg">{slide.subtitle}</p>
                <div className="mt-10 flex flex-wrap items-center gap-3">
                    <Link href={slide.ctaLink} className="btn-primary !bg-cream !border-cream !text-ink hover:!bg-bronze hover:!border-bronze hover:!text-cream">
                        {slide.ctaText}
                    </Link>
                    <Link href="/customize" className="btn-secondary !border-cream/40 !text-cream hover:!bg-cream hover:!text-ink">
                        Design Yours
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-8 right-5 z-20 flex items-center gap-2 sm:right-8">
                <button onClick={prev} className="flex h-11 w-11 items-center justify-center border border-cream/30 text-cream transition-colors hover:border-cream hover:bg-cream hover:text-ink">
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={next} className="flex h-11 w-11 items-center justify-center border border-cream/30 text-cream transition-colors hover:border-cream hover:bg-cream hover:text-ink">
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            <div className="absolute bottom-8 left-5 z-20 flex items-center gap-2 sm:left-8">
                {HERO_SLIDES.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setI(idx)}
                        className={`h-1 transition-all ${idx === i ? 'w-10 bg-cream' : 'w-4 bg-cream/30'}`}
                        aria-label={`Slide ${idx + 1}`}
                    />
                ))}
            </div>
        </section>
    );
}

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SmartImage from '@/components/ui/SmartImage';

export default function CTABlock() {
    return (
        <section className="relative overflow-hidden bg-ink py-24 text-cream md:py-32">
            <div className="absolute inset-0 opacity-30">
                <SmartImage
                    src="https://images.unsplash.com/photo-1526738549149-8e07ead6a224?auto=format&fit=crop&w=1200&q=70"
                    alt=""
                    fill
                    sizes="100vw"
                    className="object-cover"
                />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
            <div className="container-luxe relative z-10 grid gap-8 md:grid-cols-2 md:items-center">
                <div>
                    <span className="eyebrow text-cream/60">— Design Studio</span>
                    <h2 className="mt-4 font-display text-5xl leading-[0.95] tracking-editorial md:text-7xl">
                        Make it <span className="italic-display">yours</span>.
                    </h2>
                    <p className="mt-6 max-w-md text-base text-cream/80">
                        Drop in a photo, generate with AI, or build from scratch. Premium print, edge-to-edge.
                    </p>
                </div>
                <div className="flex flex-col gap-3 md:items-end">
                    <Link href="/customize" className="btn-primary !bg-cream !border-cream !text-ink hover:!bg-bronze hover:!border-bronze hover:!text-cream">
                        Open Studio <ArrowRight className="h-3 w-3" />
                    </Link>
                    <Link href="/shop" className="btn-secondary !border-cream/40 !text-cream hover:!bg-cream hover:!text-ink">
                        Shop Collection
                    </Link>
                </div>
            </div>
        </section>
    );
}

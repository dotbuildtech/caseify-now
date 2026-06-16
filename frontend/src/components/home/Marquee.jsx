import { MARQUEE } from '@/utils/constants';

export default function Marquee() {
    const items = [...MARQUEE, ...MARQUEE];
    return (
        <div className="border-y border-border/60 bg-surface overflow-hidden">
            <div className="flex animate-marquee whitespace-nowrap py-4">
                {items.map((text, i) => (
                    <div key={i} className="mx-8 flex items-center gap-3 font-display text-xl font-light italic tracking-tight md:text-2xl">
                        <span className="text-ink/80">{text}</span>
                        <span className="text-bronze/40">✦</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

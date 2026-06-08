'use client';
import { MARQUEE } from '@/utils/constants';

export default function Marquee() {
    const items = [...MARQUEE, ...MARQUEE];
    return (
        <div className="border-y border-border bg-surface py-4 overflow-hidden">
            <div className="flex animate-marquee whitespace-nowrap">
                {items.map((text, i) => (
                    <div key={i} className="mx-8 flex items-center gap-3 font-display text-2xl font-light italic md:text-3xl">
                        <span className="text-ink/90">{text}</span>
                        <span className="text-bronze">✦</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

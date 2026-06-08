'use client';
import { ANNOUNCEMENTS } from '@/utils/constants';

export default function AnnouncementBar() {
    const items = [...ANNOUNCEMENTS, ...ANNOUNCEMENTS];
    return (
        <div className="bg-ink text-cream overflow-hidden border-b border-ink/10">
            <div className="flex animate-marquee whitespace-nowrap py-2.5">
                {items.map((text, i) => (
                    <div key={i} className="mx-8 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.28em]">
                        <span className="h-1 w-1 rounded-full bg-bronze" />
                        <span>{text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const TESTIMONIALS = [
    { quote: 'Excellent quality and amazing designs. My phone is protected and looks fantastic.', author: 'Vikram Reddy', role: 'Hyderabad' },
    { quote: 'Fast shipping, great prices, and the case fits perfectly. Highly recommend!', author: 'Neha Sharma', role: 'Mumbai' },
    { quote: 'Customer service is top-notch. Had an issue and they resolved it instantly.', author: 'Arjun Kumar', role: 'Delhi' }
];

export default function Testimonials() {
    return (
        <section className="bg-surface py-20 md:py-28">
            <div className="container-luxe">
                <div className="mb-12 md:mb-16">
                    <span className="eyebrow">— Reviews</span>
                    <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl">
                        What customers<br />
                        <span className="italic-display">say</span>.
                    </h2>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    {TESTIMONIALS.map((t) => (
                        <div key={t.author} className="border border-border bg-background p-8 md:p-10">
                            <span className="font-display text-5xl text-bronze leading-none">"</span>
                            <p className="mt-4 font-display text-lg leading-snug md:text-xl">{t.quote}</p>
                            <div className="mt-8 border-t border-border pt-4">
                                <p className="text-sm font-semibold text-ink">{t.author}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-light">{t.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

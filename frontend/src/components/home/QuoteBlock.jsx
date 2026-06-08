export default function QuoteBlock() {
    return (
        <section className="bg-ink py-24 text-cream md:py-32">
            <div className="container-luxe">
                <div className="mx-auto max-w-4xl text-center">
                    <span className="eyebrow text-cream/60">— Our Promise</span>
                    <blockquote className="mt-8 font-display text-4xl leading-[1.1] tracking-editorial md:text-6xl">
                        "Protection meets <span className="italic-display">style</span>.
                        <span className="block mt-2 not-italic">Every case, a <span className="italic-display">statement</span>."</span>
                    </blockquote>
                    <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.32em] text-cream/60">— DotBuild Team</p>
                </div>
            </div>
        </section>
    );
}

import { Truck, Shield, Heart, Sparkles } from 'lucide-react';

const ICONS = { Truck, Shield, Heart, Sparkles };
const FEATURES = [
    { title: 'Free Shipping', description: 'Orders above ₹500 shipped free', icon: 'Truck' },
    { title: 'Secure Payments', description: 'UPI, Cards, and Cash on Delivery', icon: 'Shield' },
    { title: '30-Day Returns', description: 'No questions asked return policy', icon: 'Heart' },
    { title: 'Premium Quality', description: 'Tested and certified products only', icon: 'Sparkles' }
];

export default function ValuesGrid() {
    return (
        <section className="bg-background-light py-24 md:py-32">
            <div className="container-luxe">
                <div className="mb-14 text-center md:mb-18">
                    <span className="eyebrow">— Why Choose Us</span>
                    <h2 className="mt-5 font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl">
                        Quality you can <span className="italic-display">trust</span>.
                    </h2>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
                    {FEATURES.map((f) => {
                        const Icon = ICONS[f.icon];
                        return (
                            <div
                                key={f.title}
                                className="group bg-surface p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/5 md:p-9"
                            >
                                <div className="flex h-12 w-12 items-center justify-center bg-background-light transition-colors group-hover:bg-bronze/10">
                                    <Icon className="h-6 w-6 text-ink transition-colors group-hover:text-bronze" strokeWidth={1.25} />
                                </div>
                                <h3 className="mt-6 font-display text-xl md:text-2xl">{f.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-text-light">{f.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

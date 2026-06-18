export default function Loading() {
    return (
        <>
            <div className="h-[70vh] min-h-[500px] bg-ink animate-pulse" />
            <div className="border-y border-border/60 bg-surface overflow-hidden">
                <div className="py-4 text-center text-xl font-display italic text-ink/40 tracking-tight">
                    Loading...
                </div>
            </div>
            <section className="bg-background pt-24 pb-28 md:pt-32 md:pb-36">
                <div className="container-luxe">
                    <div className="mb-12 text-center md:mb-20">
                        <span className="eyebrow">— Browse Categories</span>
                        <h2 className="mt-4 mx-auto max-w-3xl font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl lg:text-7xl">Loading...</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="aspect-[4/5] animate-pulse bg-background-light" />
                        ))}
                    </div>
                </div>
            </section>
            <section className="bg-surface py-20 md:py-28">
                <div className="container-luxe">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i}>
                                <div className="aspect-[3/4] bg-background-light animate-pulse" />
                                <div className="mt-4 h-4 w-2/3 bg-background-light animate-pulse" />
                                <div className="mt-2 h-3 w-1/3 bg-background-light animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}

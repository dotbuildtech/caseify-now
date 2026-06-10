import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="container-luxe py-20 md:py-32 text-center">
            <span className="eyebrow">— 404</span>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-editorial md:text-7xl">
                Page not <span className="italic-display">found</span>.
            </h1>
            <p className="mt-4 text-sm text-text-light max-w-md mx-auto">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link href="/" className="btn-primary">Back to Home</Link>
                <Link href="/shop" className="btn-secondary">Browse Products</Link>
            </div>
        </div>
    );
}

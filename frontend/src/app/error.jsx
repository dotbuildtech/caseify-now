'use client';
import Link from 'next/link';

export default function Error({ error, reset }) {
    return (
        <div className="container-luxe py-20 md:py-32 text-center">
            <span className="eyebrow">— Oops</span>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-editorial md:text-7xl">
                Something went <span className="italic-display">wrong</span>.
            </h1>
            <p className="mt-4 text-sm text-text-light max-w-md mx-auto">
                An unexpected error occurred. Please try again.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
                <button onClick={reset} className="btn-primary">Try Again</button>
                <Link href="/" className="btn-secondary">Back to Home</Link>
            </div>
        </div>
    );
}

import HomePageClient from '@/components/home/HomePageClient';
import { Suspense } from 'react';

export const revalidate = 300;

export default async function HomePage() {
    let initialData = null;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        const res = await fetch(`${baseUrl}/api/homepage`, {
            next: { revalidate: 300 },
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (res.ok) {
            initialData = await res.json();
        }
    } catch {
        // fallback to client-side fetch
    }

    return (
        <Suspense fallback={<div className="h-screen bg-ink animate-pulse" />}>
            <HomePageClient initialData={initialData} />
        </Suspense>
    );
}

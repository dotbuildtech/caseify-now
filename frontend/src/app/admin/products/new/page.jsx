'use client';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';

export default function AdminNewProductPage() {
    return (
        <>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-light hover:text-bronze">
                        <ChevronLeft className="h-3 w-3" /> Back to products
                    </Link>
                    <h2 className="mt-2 font-display text-2xl">New product</h2>
                </div>
            </div>
            <ProductForm mode="create" initial={null} />
        </>
    );
}

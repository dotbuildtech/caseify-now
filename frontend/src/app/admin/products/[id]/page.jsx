'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';
import { adminGetProduct } from '@/services/adminApi';
import { useToast } from '@/components/ui/Toast';

export default function AdminEditProductPage() {
    const { id } = useParams();
    const toast = useToast();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        let mounted = true;
        adminGetProduct(id)
            .then((d) => { if (mounted) setProduct(d?.data || d); })
            .catch((e) => {
                if (!mounted) return;
                setErr(e.response?.data?.message || 'Failed to load product');
                toast.error('Could not load product');
            })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [id, toast]);

    return (
        <>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-light hover:text-bronze">
                        <ChevronLeft className="h-3 w-3" /> Back to products
                    </Link>
                    <h2 className="mt-2 font-display text-2xl">{product ? product.name : 'Edit product'}</h2>
                    {product && <p className="mt-1 text-xs text-text-light">SKU {product.sku || '—'} · ID {product.id}</p>}
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-background-light animate-pulse" />)}
                </div>
            ) : err ? (
                <div className="border border-error bg-surface p-6 text-sm text-error">{err}</div>
            ) : product ? (
                <ProductForm mode="edit" initial={product} />
            ) : null}
        </>
    );
}

'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { adminGetStudioProduct } from '@/services/adminApi';
import StudioProductForm from '@/components/admin/StudioProductForm';

export default function EditStudioProductPage() {
    const params = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await adminGetStudioProduct(params.id);
                setProduct(data);
            } catch {
                setError('Failed to load product');
            } finally {
                setLoading(false);
            }
        })();
    }, [params.id]);

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    if (error) return <div className="py-20 text-center text-sm text-text-light">{error}</div>;
    if (!product) return <div className="py-20 text-center text-sm text-text-light">Product not found</div>;

    return <StudioProductForm product={product} />;
}

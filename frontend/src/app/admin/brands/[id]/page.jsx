'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BrandForm from '../BrandForm';
import { adminGetBrand } from '@/services/adminApi';

export default function EditBrandPage() {
    const { id } = useParams();
    const [initial, setInitial] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            try {
                const brand = await adminGetBrand(id);
                setInitial(brand);
            } catch { /* ignore */ }
            setLoading(false);
        })();
    }, [id]);
    if (loading) return <div className="h-48 bg-background-light animate-pulse" />;
    if (!initial) return <p className="text-sm text-text-light">Brand not found.</p>;
    return <BrandForm mode="edit" initial={initial} />;
}

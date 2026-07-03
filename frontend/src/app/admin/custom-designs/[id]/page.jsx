'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CustomDesignForm from '@/components/admin/CustomDesignForm';
import { adminGetCustomDesign } from '@/services/adminApi';

export default function EditCustomDesignPage() {
    const { id } = useParams();
    const [initial, setInitial] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            try {
                const design = await adminGetCustomDesign(id);
                setInitial(design);
            } catch { /* ignore */ }
            setLoading(false);
        })();
    }, [id]);
    if (loading) return <div className="h-48 bg-background-light animate-pulse" />;
    if (!initial) return <p className="text-sm text-text-light">Design not found.</p>;
    return <CustomDesignForm mode="edit" initial={initial} />;
}

'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ModelForm from '../ModelForm';
import { adminGetDeviceModel } from '@/services/adminApi';

export default function EditModelPage() {
    const { id } = useParams();
    const [initial, setInitial] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            try {
                const model = await adminGetDeviceModel(id);
                setInitial(model);
            } catch { /* ignore */ }
            setLoading(false);
        })();
    }, [id]);
    if (loading) return <div className="h-48 bg-background-light animate-pulse" />;
    if (!initial) return <p className="text-sm text-text-light">Model not found.</p>;
    return <ModelForm mode="edit" initial={initial} />;
}

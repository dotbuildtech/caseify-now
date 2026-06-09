'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import HeroSlideForm from '../HeroSlideForm';
import api from '@/services/api';

export default function EditHeroSlidePage() {
    const { id } = useParams();
    const [initial, setInitial] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            try {
                const r = await api.get(`/hero-slides/${id}`);
                setInitial(r.data);
            } catch { /* ignore */ }
            setLoading(false);
        })();
    }, [id]);
    if (loading) return <div className="h-48 bg-background-light animate-pulse" />;
    if (!initial) return <p className="text-sm text-text-light">Hero slide not found.</p>;
    return <HeroSlideForm mode="edit" initial={initial} />;
}

'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ShoppingBag, Smartphone, Layers, Type, Sparkles, Image as ImageIcon, Sticker, Palette, Upload, ChevronRight, Heart } from 'lucide-react';
import { StudioProvider, useStudio } from '@/context/StudioContext';
import { PHONE_MODELS, MATERIALS, getPhoneById, getMaterialById, BASE_PRICE } from '@/utils/studio';
import { formatINR } from '@/utils/format';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/Toast';
import StudioCanvas from '@/components/Studio/StudioCanvas';
import UploadTab from '@/components/Studio/UploadTab';
import AITab from '@/components/Studio/AITab';
import TextTab from '@/components/Studio/TextTab';
import PhotoTab from '@/components/Studio/PhotoTab';
import StickersTab from '@/components/Studio/StickersTab';
import ColorTab from '@/components/Studio/ColorTab';
import LayersTab from '@/components/Studio/LayersTab';

const TABS = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'ai', label: 'AI', icon: Sparkles },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'photo', label: 'Photo', icon: ImageIcon },
    { id: 'stickers', label: 'Stickers', icon: Sticker },
    { id: 'color', label: 'Color', icon: Palette },
    { id: 'layers', label: 'Layers', icon: Layers }
];

function StudioInner() {
    const router = useRouter();
    const { user } = useAuth();
    const { addItem } = useCart();
    const toast = useToast();
    const { phone, phoneId, setPhoneId, material, materialId, setMaterialId, saveDesign, totalPrice, layers, form } = useStudio();
    const [tab, setTab] = useState('upload');
    const [saving, setSaving] = useState(false);
    const [adding, setAdding] = useState(false);
    const canvasCaptureRef = useRef(null);

    const handleSave = async () => {
        if (!user) { router.push('/login?redirect=/customize'); return; }
        try {
            setSaving(true);
            const thumb = canvasCaptureRef.current ? await canvasCaptureRef.current() : null;
            const design = saveDesign(thumb);
            toast.success('Design saved');
        } catch {
            toast.error('Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleAddToBag = async () => {
        if (!user) { router.push('/login?redirect=/customize'); return; }
        try {
            setAdding(true);
            const thumb = canvasCaptureRef.current ? await canvasCaptureRef.current() : null;
            const design = saveDesign(thumb);
            const customProductId = 1;
            const note = encodeURIComponent(JSON.stringify({ designId: design.id, phoneId, materialId, thumbnail: thumb, layers: layers.length }));
            router.push(`/shop?q=custom_${design.id}&custom=true&note=${note}`);
            toast.success('Design saved — add a base case to continue');
        } catch {
            toast.error('Failed');
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="bg-background">
            <div className="border-b border-border bg-surface">
                <div className="container-luxe py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <span className="eyebrow">— Design Studio</span>
                            <h1 className="mt-1 font-display text-2xl">Make it <span className="italic-display">yours</span>.</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleSave} disabled={saving} className="btn-ghost">
                                <Save className="h-3 w-3" /> {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={handleAddToBag} disabled={adding} className="btn-primary">
                                <ShoppingBag className="h-3 w-3" /> Add to bag — {formatINR(totalPrice)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-luxe py-8">
                <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                    <div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <h3 className="label-luxe flex items-center gap-2"><Smartphone className="h-3 w-3" /> Phone model</h3>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {PHONE_MODELS.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setPhoneId(p.id)}
                                            className={`border px-3 py-1.5 text-xs font-medium ${phoneId === p.id ? 'border-ink bg-ink text-cream' : 'border-border bg-surface hover:border-ink'}`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-text-light">{phone.size}{phone.magSafe ? ' · MagSafe' : ''}</p>
                            </div>

                            <div>
                                <h3 className="label-luxe">Material</h3>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {MATERIALS.map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setMaterialId(m.id)}
                                            className={`flex items-start gap-2 border p-2 text-left ${materialId === m.id ? 'border-ink bg-ink text-cream' : 'border-border bg-surface hover:border-ink'}`}
                                        >
                                            <div className="mt-1 h-5 w-5 flex-shrink-0 border border-current" style={{ background: m.swatch }} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium leading-tight">{m.label}</p>
                                                <p className={`mt-0.5 text-[10px] ${materialId === m.id ? 'text-cream/70' : 'text-text-light'}`}>{formatINR(m.price)}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-text-light">{material.description}</p>
                            </div>
                        </div>

                        <div className="mt-10">
                            <StudioCanvas onCapture={canvasCaptureRef} />
                        </div>
                    </div>

                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <div className="flex flex-wrap gap-1 border-b border-border">
                            {TABS.map((t) => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => setTab(t.id)}
                                        className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${tab === t.id ? 'border-ink text-ink' : 'border-transparent text-text-light hover:text-ink'}`}
                                    >
                                        <Icon className="h-3 w-3" /> {t.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="border border-t-0 border-border bg-surface p-5">
                            {tab === 'upload' && <UploadTab />}
                            {tab === 'ai' && <AITab />}
                            {tab === 'text' && <TextTab />}
                            {tab === 'photo' && <PhotoTab />}
                            {tab === 'stickers' && <StickersTab />}
                            {tab === 'color' && <ColorTab />}
                            {tab === 'layers' && <LayersTab />}
                        </div>

                        <div className="mt-4 flex items-center justify-between border border-border bg-surface p-4 text-xs">
                            <span className="text-text-light">Total</span>
                            <span className="font-display text-lg font-semibold tabular-nums">{formatINR(totalPrice)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CustomizePage() {
    return (
        <StudioProvider>
            <StudioInner />
        </StudioProvider>
    );
}

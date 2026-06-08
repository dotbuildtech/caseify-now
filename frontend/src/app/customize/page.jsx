'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ShoppingBag, Smartphone, Layers, Type, Sparkles, Image as ImageIcon, Sticker, Palette, Upload, Heart, Check } from 'lucide-react';
import { StudioProvider, useStudio } from '@/context/StudioContext';
import { PHONE_MODELS, MATERIALS } from '@/utils/studio';
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

const CUSTOM_PRODUCT_ID = 9999;

function StudioInner() {
    const router = useRouter();
    const { user } = useAuth();
    const { addItem } = useCart();
    const toast = useToast();
    const { phone, phoneId, setPhoneId, material, materialId, setMaterialId, saveDesign, totalPrice, layers, form } = useStudio();
    const [tab, setTab] = useState('upload');
    const [saving, setSaving] = useState(false);
    const [adding, setAdding] = useState(false);
    const [saved, setSaved] = useState(false);
    const canvasCaptureRef = useRef(null);

    const handleSave = async () => {
        if (!user) { router.push('/login?redirect=/customize'); return; }
        try {
            setSaving(true);
            const thumb = canvasCaptureRef.current ? await canvasCaptureRef.current() : null;
            saveDesign(thumb);
            setSaved(true);
            toast.success('Design saved');
            setTimeout(() => setSaved(false), 2000);
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

            const designData = {
                designId: design.id,
                createdAt: design.createdAt,
                phoneId,
                phoneLabel: phone.label,
                phoneSize: phone.size,
                magSafe: phone.magSafe,
                materialId,
                materialLabel: material.label,
                materialDescription: material.description,
                materialPrice: material.price,
                bgColor: form.bgColor,
                bgImage: form.bgImage,
                layerCount: layers.length,
                layers: layers.map((l) => ({
                    type: l.type,
                    text: l.text,
                    emoji: l.emoji,
                    color: l.color,
                    size: l.size,
                    x: l.x,
                    y: l.y,
                    scale: l.scale,
                    rotation: l.rotation,
                    opacity: l.opacity
                })),
                thumbnail: thumb
            };

            await addItem(
                CUSTOM_PRODUCT_ID,
                1,
                designData
            );

            toast.success('Custom case added to bag');
            router.push('/cart');
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to add to bag');
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50">
            <div className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">— Design Studio</span>
                        <h1 className="font-display text-2xl">Make it <span className="italic text-red-600/80 font-light">yours</span>.</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 ${saved ? 'border-green-500 bg-green-50 text-green-600' : 'border-stone-300 bg-white text-stone-700 hover:border-stone-900 hover:text-stone-900'}`}
                        >
                            {saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : <><Heart className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}</>}
                        </button>
                        <button
                            onClick={handleAddToBag}
                            disabled={adding}
                            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-white shadow-lg shadow-stone-900/10 transition-all duration-300 hover:bg-stone-800 hover:shadow-xl hover:shadow-stone-900/20 active:scale-95 disabled:opacity-60"
                        >
                            <ShoppingBag className="h-3.5 w-3.5" /> {adding ? 'Adding…' : `Add to bag — ${formatINR(totalPrice)}`}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
                    <div className="flex flex-col items-center animate-fadeIn">
                        <div className="relative">
                            <StudioCanvas onCapture={canvasCaptureRef} />
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            100% — fit to print
                        </div>
                    </div>

                    <div className="space-y-6 animate-slideUp">
                        <div>
                            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">Phone model</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {PHONE_MODELS.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setPhoneId(p.id)}
                                        className={`rounded-full border px-4 py-2 text-xs font-medium transition-all duration-300 ${phoneId === p.id ? 'border-stone-900 bg-stone-900 text-white shadow-md' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-900'}`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-stone-400">
                                {phone.size}{phone.magSafe ? ' · MagSafe' : ''} · {material.description}
                            </p>
                        </div>

                        <div>
                            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">Material</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {MATERIALS.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMaterialId(m.id)}
                                        className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-300 ${materialId === m.id ? 'border-stone-900 bg-stone-900 text-white shadow-lg shadow-stone-900/15' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400 hover:shadow-md'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-lg shadow-inner ring-1 ring-black/5"
                                                style={{ background: `linear-gradient(135deg, ${m.swatch} 0%, ${m.swatch}dd 100%)` }}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold leading-tight">{m.label}</p>
                                                <p className={`mt-0.5 text-[10px] ${materialId === m.id ? 'text-white/60' : 'text-stone-400'}`}>{formatINR(m.price)}</p>
                                            </div>
                                        </div>
                                        {materialId === m.id && (
                                            <div className="absolute -right-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                                                <Check className="h-3 w-3 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-1 shadow-sm">
                            <div className="flex">
                                {TABS.map((t) => {
                                    const Icon = t.icon;
                                    const active = tab === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => setTab(t.id)}
                                            className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] transition-all duration-300 ${active ? 'bg-stone-900 text-white shadow-md' : 'text-stone-400 hover:text-stone-700'}`}
                                        >
                                            <Icon className={`h-4 w-4 transition-transform duration-300 ${active ? 'scale-110' : ''}`} />
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                            {tab === 'upload' && <UploadTab key="upload" />}
                            {tab === 'ai' && <AITab key="ai" />}
                            {tab === 'text' && <TextTab key="text" />}
                            {tab === 'photo' && <PhotoTab key="photo" />}
                            {tab === 'stickers' && <StickersTab key="stickers" />}
                            {tab === 'color' && <ColorTab key="color" />}
                            {tab === 'layers' && <LayersTab key="layers" />}
                        </div>

                        <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">Total price</span>
                            <span className="font-display text-2xl font-semibold tabular-nums">{formatINR(totalPrice)}</span>
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

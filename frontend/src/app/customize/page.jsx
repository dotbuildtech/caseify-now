'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Layers, Type, Sparkles, Image as ImageIcon, Sticker, Palette, Upload, Heart, Check } from 'lucide-react';
import { StudioProvider, useStudio } from '@/context/StudioContext';
import { formatINR } from '@/utils/format';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/Toast';
import { uploadStudioImage } from '@/services/studioApi';

import StudioCanvas from '@/components/Studio/StudioCanvas';
import BrandModelSelector from '@/components/Studio/BrandModelSelector';
import MaterialSelector from '@/components/Studio/MaterialSelector';

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
    { id: 'photo', label: 'Photos', icon: ImageIcon },
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
    const { brand, modelId, model, materialId, material, saveDesign, totalPrice, layers, form } = useStudio();
    const [tab, setTab] = useState('upload');
    const [saving, setSaving] = useState(false);
    const [adding, setAdding] = useState(false);
    const [saved, setSaved] = useState(false);
    const canvasCaptureRef = useRef(null);

    const captureCanvas = async () => {
        return canvasCaptureRef.current ? await canvasCaptureRef.current() : null;
    };

    const handleSave = async () => {
        if (!user) { router.push('/login?redirect=/customize'); return; }
        try {
            setSaving(true);
            const dataUrl = await captureCanvas();
            if (!dataUrl) throw new Error('Capture failed');
            const cloudUrl = await uploadStudioImage(dataUrl);
            saveDesign(cloudUrl || dataUrl);
            setSaved(true);
            toast.success('Design saved');
            setTimeout(() => setSaved(false), 2000);
        } catch { toast.error('Save failed'); }
        finally { setSaving(false); }
    };

    const handleAddToBag = async () => {
        if (!user) { router.push('/login?redirect=/customize'); return; }
        if (!model) { toast.error('Please select a phone model'); return; }
        if (!material) { toast.error('Please select a material'); return; }
        try {
            setAdding(true);
            const dataUrl = await captureCanvas();
            if (!dataUrl) throw new Error('Canvas capture failed');
            const cloudUrl = await uploadStudioImage(dataUrl);
            const thumbnail = cloudUrl || null;
            const design = saveDesign(thumbnail);
            const designData = {
                designId: design.id,
                createdAt: design.createdAt,
                brand,
                modelId,
                modelLabel: model.label,
                modelSize: model.size,
                materialId,
                materialLabel: material.label,
                materialDescription: material.description,
                materialPrice: material.price,
                totalPrice,
                bgColor: form.bgColor,
                bgImage: form.bgImage,
                layerCount: layers.length,
                layers: layers.map((l) => ({
                    type: l.type, text: l.text, emoji: l.emoji, color: l.color,
                    size: l.size, font: l.font, bold: l.bold, uppercase: l.uppercase, letterSpacing: l.letterSpacing,
                    stickerId: l.stickerId,
                    x: l.x, y: l.y, w: l.w, h: l.h,
                    rotation: l.rotation, opacity: l.opacity, filters: l.filters,
                    url: l.url
                })),
                thumbnail
            };
            await addItem(CUSTOM_PRODUCT_ID, 1, designData);
            toast.success('Custom case added to bag');
            router.push('/cart');
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to add to bag');
        }
        finally { setAdding(false); }
    };

    return (
        <div className="h-screen bg-stone-50 flex flex-col overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Vertical Tab Bar — visible on lg+ */}
                <div className="hidden lg:flex flex-col items-center gap-1 border-r border-stone-200 bg-white pt-4 pb-6 px-1.5 w-[72px] shrink-0 overflow-y-auto">
                    {TABS.map((t) => {
                        const Icon = t.icon;
                        const active = tab === t.id;
                        return (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 w-full text-[8px] font-semibold uppercase tracking-[0.1em] transition-all duration-300 ${active ? 'bg-stone-900 text-white shadow-md' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'}`}>
                                <Icon className={`h-[18px] w-[18px] transition-transform duration-300 ${active ? 'scale-110' : ''}`} />
                                <span>{t.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Center: Canvas + Mobile Content */}
                <div className="flex-1 flex items-start justify-center overflow-y-auto pt-2 pb-28 md:pt-4 md:pb-10 px-4 lg:pb-6">
                    <div className="w-full max-w-[500px] space-y-6">
                        <div className="sticky top-4 z-10 w-full flex justify-center">
                            <StudioCanvas onCapture={canvasCaptureRef} />
                        </div>

                        <div className="lg:hidden space-y-5">
                            <BrandModelSelector />
                            <MaterialSelector />
                            <div className="rounded-xl border border-stone-200 bg-stone-50">
                                <div className="p-4">
                                    {tab === 'upload' && <UploadTab key="upload" />}
                                    {tab === 'ai' && <AITab key="ai" />}
                                    {tab === 'text' && <TextTab key="text" />}
                                    {tab === 'photo' && <PhotoTab key="photo" />}
                                    {tab === 'stickers' && <StickersTab key="stickers" />}
                                    {tab === 'color' && <ColorTab key="color" />}
                                    {tab === 'layers' && <LayersTab key="layers" />}
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-4">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">Total price</span>
                                <div className="text-right">
                                    <span className="font-display text-xl md:text-2xl font-semibold tabular-nums">{formatINR(totalPrice)}</span>
                                    {material && <p className="text-[9px] text-stone-400">{material.label}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Content Panel — visible on lg+ */}
                <div className="hidden lg:flex w-[380px] shrink-0 border-l border-stone-200 bg-white flex-col">
                    {/* Fixed actions bar */}
                    <div className="shrink-0 border-b border-stone-200 p-4 md:p-5 space-y-3">
                        <button onClick={handleSave} disabled={saving}
                            className={`w-full flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 ${saved ? 'border-green-500 bg-green-50 text-green-600' : 'border-stone-300 bg-white text-stone-700 hover:border-stone-900 hover:text-stone-900'}`}>
                            {saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : <><Heart className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}</>}
                        </button>
                        <button onClick={handleAddToBag} disabled={adding}
                            className="w-full flex items-center justify-center gap-1.5 rounded-full bg-stone-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-white shadow-lg shadow-stone-900/10 transition-all duration-300 hover:bg-stone-800 hover:shadow-xl hover:shadow-stone-900/20 active:scale-95 disabled:opacity-60">
                            <ShoppingBag className="h-3.5 w-3.5" /> {adding ? 'Adding…' : <><span>Add to bag — </span>{formatINR(totalPrice)}</>}
                        </button>
                    </div>
                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
                        <BrandModelSelector />
                        <MaterialSelector />

                        <div className="rounded-xl border border-stone-200 bg-stone-50">
                            <div className="p-4">
                                {tab === 'upload' && <UploadTab key="upload" />}
                                {tab === 'ai' && <AITab key="ai" />}
                                {tab === 'text' && <TextTab key="text" />}
                                {tab === 'photo' && <PhotoTab key="photo" />}
                                {tab === 'stickers' && <StickersTab key="stickers" />}
                                {tab === 'color' && <ColorTab key="color" />}
                                {tab === 'layers' && <LayersTab key="layers" />}
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-4">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">Total price</span>
                            <div className="text-right">
                                <span className="font-display text-xl md:text-2xl font-semibold tabular-nums">{formatINR(totalPrice)}</span>
                                {material && <p className="text-[9px] text-stone-400">{material.label}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile: Save / Add to Bag bar — visible below lg */}
            <div className="lg:hidden fixed bottom-[52px] left-0 right-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur-md px-4 py-2.5 flex items-center gap-2 shadow-lg">
                <button onClick={handleSave} disabled={saving}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] transition-all duration-300 ${saved ? 'border-green-500 bg-green-50 text-green-600' : 'border-stone-300 bg-white text-stone-700'}`}>
                    {saved ? <><Check className="h-3 w-3" /> Saved</> : <><Heart className="h-3 w-3" /> Save</>}
                </button>
                <button onClick={handleAddToBag} disabled={adding}
                    className="flex-[2] flex items-center justify-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white shadow-lg shadow-stone-900/10 transition-all duration-300 active:scale-95 disabled:opacity-60">
                    <ShoppingBag className="h-3 w-3" /> {adding ? 'Adding…' : <>{formatINR(totalPrice)}</>}
                </button>
            </div>

            {/* Mobile: Bottom Tab Bar — visible below lg */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white shadow-2xl">
                <div className="flex">
                    {TABS.map((t) => {
                        const Icon = t.icon;
                        const active = tab === t.id;
                        return (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[8px] font-semibold uppercase tracking-[0.08em] transition-all duration-300 ${active ? 'text-stone-900' : 'text-stone-400 hover:text-stone-700'}`}>
                                <Icon className={`h-[18px] w-[18px] transition-transform ${active ? 'scale-110' : ''}`} />
                                <span>{t.label}</span>
                            </button>
                        );
                    })}
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

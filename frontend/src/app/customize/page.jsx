'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ShoppingBag, Layers, Type, Sparkles, Image as ImageIcon, Sticker, Palette, Upload, Heart, Check, Layout } from 'lucide-react';
import { StudioProvider, useStudio } from '@/context/StudioContext';
import { formatINR } from '@/utils/format';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/Toast';
import { fetchTemplates } from '@/services/studioApi';
import StudioCanvas from '@/components/Studio/StudioCanvas';
import BrandModelSelector from '@/components/Studio/BrandModelSelector';
import MaterialSelector from '@/components/Studio/MaterialSelector';
import MaterialDesigns from '@/components/Studio/MaterialDesigns';
import UploadTab from '@/components/Studio/UploadTab';
import AITab from '@/components/Studio/AITab';
import TextTab from '@/components/Studio/TextTab';
import PhotoTab from '@/components/Studio/PhotoTab';
import StickersTab from '@/components/Studio/StickersTab';
import ColorTab from '@/components/Studio/ColorTab';
import LayersTab from '@/components/Studio/LayersTab';
import ImageEditor from '@/components/Studio/ImageEditor';

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
    const { brand, modelId, model, materialId, material, saveDesign, totalPrice, layers, form, applyTemplate } = useStudio();
    const [tab, setTab] = useState('upload');
    const [saving, setSaving] = useState(false);
    const [adding, setAdding] = useState(false);
    const [saved, setSaved] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [templateOpen, setTemplateOpen] = useState(false);
    const canvasCaptureRef = useRef(null);

    const loadTemplates = async () => {
        setTemplateOpen((v) => !v);
        if (templates.length > 0) return;
        setTemplatesLoading(true);
        try {
            const data = await fetchTemplates();
            setTemplates(data);
        } catch { toast.error('Failed to load templates'); }
        finally { setTemplatesLoading(false); }
    };

    const handleSave = async () => {
        if (!user) { router.push('/login?redirect=/customize'); return; }
        try {
            setSaving(true);
            const thumb = canvasCaptureRef.current ? await canvasCaptureRef.current() : null;
            saveDesign(thumb);
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
            const thumb = canvasCaptureRef.current ? await canvasCaptureRef.current() : null;
            const design = saveDesign(thumb);
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
                    size: l.size, x: l.x, y: l.y, scale: l.scale,
                    rotation: l.rotation, opacity: l.opacity, filters: l.filters
                })),
                thumbnail: thumb
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
        <div className="min-h-screen bg-stone-50">
            <div className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">— Design Studio</span>
                        <h1 className="font-display text-2xl">Make it <span className="italic text-red-600/80 font-light">yours</span>.</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={loadTemplates} className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-stone-700 transition-all duration-300 hover:border-stone-900 hover:text-stone-900">
                            <Layout className="h-3.5 w-3.5" /> Templates
                        </button>
                        <button onClick={handleSave} disabled={saving} className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 ${saved ? 'border-green-500 bg-green-50 text-green-600' : 'border-stone-300 bg-white text-stone-700 hover:border-stone-900 hover:text-stone-900'}`}>
                            {saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : <><Heart className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}</>}
                        </button>
                        <button onClick={handleAddToBag} disabled={adding} className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-white shadow-lg shadow-stone-900/10 transition-all duration-300 hover:bg-stone-800 hover:shadow-xl hover:shadow-stone-900/20 active:scale-95 disabled:opacity-60">
                            <ShoppingBag className="h-3.5 w-3.5" /> {adding ? 'Adding…' : `Add to bag — ${formatINR(totalPrice)}`}
                        </button>
                    </div>
                </div>
            </div>

            {templateOpen && (
                <div className="border-b border-stone-200 bg-white">
                    <div className="mx-auto max-w-7xl px-6 py-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">Templates</h3>
                            <button onClick={() => setTemplateOpen(false)} className="text-[10px] text-stone-400 hover:text-stone-600">Close</button>
                        </div>
                        {templatesLoading ? (
                            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-stone-100" />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                                {templates.map((tpl) => (
                                    <button key={tpl.id} onClick={() => { applyTemplate(tpl); setTemplateOpen(false); toast.success(`"${tpl.label}" template applied`); }} className="group relative overflow-hidden rounded-xl border border-stone-200 bg-stone-100 transition-all hover:shadow-md hover:-translate-y-0.5">
                                        <div className="aspect-[2/3] w-full">
                                            <img src={tpl.thumb} alt={tpl.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-900/80 to-transparent p-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white">{tpl.label}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
                    <div className="flex flex-col items-center animate-fadeIn">
                        <div className="relative">
                            <StudioCanvas onCapture={canvasCaptureRef} />
                        </div>
                    </div>

                    <div className="space-y-6 animate-slideUp">
                        <BrandModelSelector />
                        <MaterialSelector />
                        <MaterialDesigns />

                        <div className="rounded-2xl border border-stone-200 bg-white p-1 shadow-sm">
                            <div className="flex">
                                {TABS.map((t) => {
                                    const Icon = t.icon;
                                    const active = tab === t.id;
                                    return (
                                        <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] transition-all duration-300 ${active ? 'bg-stone-900 text-white shadow-md' : 'text-stone-400 hover:text-stone-700'}`}>
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

                        <ImageEditor />

                        <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">Total price</span>
                            <div className="text-right">
                                <span className="font-display text-2xl font-semibold tabular-nums">{formatINR(totalPrice)}</span>
                                {material && <p className="text-[9px] text-stone-400">{material.label}</p>}
                            </div>
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

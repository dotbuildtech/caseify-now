'use client';
import { useState, useRef, useCallback } from 'react';
import { Upload, ImageIcon, FileImage } from 'lucide-react';
import { useStudio } from '@/context/StudioContext';
import { PHOTO_PRESETS } from '@/utils/studio';
import SmartImage from '@/components/ui/SmartImage';
import { useToast } from '@/components/ui/Toast';

export default function UploadTab() {
    const { addImageLayer, updateForm } = useStudio();
    const fileRef = useRef(null);
    const toast = useToast();
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const processFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please choose an image file');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File too large (max 10MB)');
            return;
        }
        setUploading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            updateForm({ imageUrl: e.target.result });
            addImageLayer(e.target.result);
            toast.success('Image added to canvas');
            setUploading(false);
        };
        reader.onerror = () => { toast.error('Failed to read file'); setUploading(false); };
        reader.readAsDataURL(file);
    };

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        processFile(e.dataTransfer.files?.[0]);
    }, []);

    const onDragOver = useCallback((e) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const onDragLeave = useCallback(() => setDragOver(false), []);

    return (
        <div className="space-y-5 animate-fadeIn">
            <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileRef.current?.click()}
                className={`group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${dragOver ? 'border-stone-900 bg-stone-100 scale-[1.02]' : 'border-stone-200 bg-stone-50 hover:border-stone-400 hover:bg-stone-100'}`}
            >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${dragOver ? 'bg-stone-900 text-white scale-110' : 'bg-stone-200 text-stone-500 group-hover:bg-stone-900 group-hover:text-white'}`}>
                    {uploading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                        <Upload className="h-6 w-6" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-semibold text-stone-700">
                        {uploading ? 'Processing…' : dragOver ? 'Drop your image here' : 'Upload your image'}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-stone-400">
                        PNG, JPG, WEBP · max 10MB
                    </p>
                </div>
            </div>
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => processFile(e.target.files?.[0])}
            />

            <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Or pick a preset</p>
                <div className="grid grid-cols-2 gap-2">
                    {PHOTO_PRESETS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => { updateForm({ bgImage: p.url }); addImageLayer(p.url); toast.success(`${p.label} added`); }}
                            className="group relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                        >
                            <SmartImage src={p.url} alt={p.label} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-900/90 via-stone-900/40 to-transparent p-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white">{p.label}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

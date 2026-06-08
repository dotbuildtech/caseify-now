'use client';
import { useState, useRef } from 'react';
import { Upload, ImageIcon } from 'lucide-react';
import { useStudio } from '@/context/StudioContext';
import { PHOTO_PRESETS } from '@/utils/studio';
import SmartImage from '@/components/ui/SmartImage';
import { useToast } from '@/components/ui/Toast';

export default function UploadTab() {
    const { addImageLayer, updateForm } = useStudio();
    const fileRef = useRef(null);
    const toast = useToast();
    const [uploading, setUploading] = useState(false);

    const onFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please choose an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large (max 5MB)');
            return;
        }
        setUploading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            updateForm({ imageUrl: e.target.result });
            addImageLayer(e.target.result);
            toast.success('Image added');
            setUploading(false);
        };
        reader.onerror = () => { toast.error('Failed to read file'); setUploading(false); };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-5">
            <div>
                <h3 className="label-luxe">Upload your photo</h3>
                <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="mt-2 flex w-full flex-col items-center gap-2 border-2 border-dashed border-border bg-background-light p-8 transition-colors hover:border-ink disabled:opacity-50"
                >
                    <Upload className="h-6 w-6 text-text-light" />
                    <p className="text-sm font-medium">{uploading ? 'Uploading...' : 'Drop or click to upload'}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-text-light">PNG, JPG · max 5MB</p>
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0])}
                />
            </div>

            <div>
                <h3 className="label-luxe">Or pick a preset</h3>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    {PHOTO_PRESETS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => { updateForm({ bgImage: p.url }); addImageLayer(p.url); toast.success(`${p.label} added`); }}
                            className="group relative aspect-square overflow-hidden border border-border bg-background-light"
                        >
                            <SmartImage src={p.url} alt={p.label} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform group-hover:scale-110" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-2 text-cream">
                                <p className="text-[10px] font-medium uppercase tracking-[0.18em]">{p.label}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

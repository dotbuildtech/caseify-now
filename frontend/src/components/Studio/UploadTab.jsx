'use client';
import { useState, useRef, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { useStudio } from '@/context/StudioContext';
import { uploadStudioImageBlob, uploadStudioImage } from '@/services/studioApi';
import { useToast } from '@/components/ui/Toast';

const MAX_DIM = 1000;
const JPEG_QUALITY = 0.7;

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width, height } = img;
            if (width > MAX_DIM || height > MAX_DIM) {
                const ratio = MAX_DIM / Math.max(width, height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
                if (!blob) { reject(new Error('Compression failed')); return; }
                resolve(blob);
            }, 'image/jpeg', JPEG_QUALITY);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
        img.src = url;
    });
}

export default function UploadTab() {
    const { addImageLayer, updateLayer, updateForm } = useStudio();
    const fileRef = useRef(null);
    const toast = useToast();
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const processFile = async (file) => {
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
        try {
            const compressedBlob = await compressImage(file);
            const localUrl = URL.createObjectURL(compressedBlob);
            updateForm({ imageUrl: localUrl });
            const layerId = addImageLayer(localUrl);
            toast.success('Image added to canvas');

            let cloudUrl = null;
            try {
                cloudUrl = await uploadStudioImageBlob(compressedBlob, 'image/jpeg');
            } catch {
                cloudUrl = null;
            }
            if (!cloudUrl) {
                try {
                    const reader = new FileReader();
                    const dataUrl = await new Promise((resolve, reject) => {
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(compressedBlob);
                    });
                    cloudUrl = await uploadStudioImage(dataUrl);
                } catch {
                    cloudUrl = null;
                }
            }

            if (cloudUrl) {
                updateLayer(layerId, { url: cloudUrl });
                updateForm({ imageUrl: cloudUrl });
                URL.revokeObjectURL(localUrl);
            }
        } catch {
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
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
                className={`group flex cursor-pointer flex-col items-center gap-2.5 rounded-xl md:rounded-2xl border-2 border-dashed p-4 md:p-8 text-center transition-all duration-300 ${dragOver ? 'border-stone-900 bg-stone-100 scale-[1.02]' : 'border-stone-200 bg-stone-50 hover:border-stone-400 hover:bg-stone-100'}`}
            >
                <div className={`flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-xl md:rounded-2xl transition-all duration-300 ${dragOver ? 'bg-stone-900 text-white scale-110' : 'bg-stone-200 text-stone-500 group-hover:bg-stone-900 group-hover:text-white'}`}>
                    {uploading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                        <Upload className="h-5 w-5 md:h-6 md:w-6" />
                    )}
                </div>
                <div>
                    <p className="text-xs md:text-sm font-semibold text-stone-700">
                        {uploading ? 'Processing…' : dragOver ? 'Drop your image here' : 'Upload your image'}
                    </p>
                    <p className="mt-0.5 md:mt-1 text-[9px] md:text-[10px] uppercase tracking-[0.15em] text-stone-400">
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

        </div>
    );
}

'use client';
import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import api from '@/services/api';
import compressImage from '@/utils/compressImage';

export default function ImageUploader({ value, onChange, label = 'Image' }) {
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);
  const inputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setLocalPreview(URL.createObjectURL(file));
    try {
      const compressed = await compressImage(file, 1000, 0.7);
      const form = new FormData();
      form.append('image', compressed);
      const { data } = await api.post('/uploads/image', form);
      onChange(data.url);
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
      setLocalPreview(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="label-luxe">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-luxe flex-1"
          placeholder="https://… or upload"
        />
        <label className="btn-secondary cursor-pointer shrink-0">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      </div>
      {localPreview && (
        <div className="relative inline-block opacity-60">
          <img src={localPreview} alt="" className="h-24 w-24 rounded-lg border border-border object-contain bg-accent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        </div>
      )}
      {value && !localPreview && (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-24 w-24 rounded-lg border border-border object-contain bg-accent" />
          <button type="button" onClick={() => onChange('')} className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center hover:bg-accent">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

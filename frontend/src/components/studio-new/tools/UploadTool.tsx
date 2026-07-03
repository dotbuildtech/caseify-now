'use client';
import { useRef, useState, useCallback } from 'react';
import { useStudioStore } from '@/store/studioStore';
import { uploadStudioImageBlob, uploadStudioImage } from '@/services/studioApi';
import { compressImage } from '@/lib/utils';
import { Upload, Image, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import type { EditableAreaData } from '@/types/studio';
import { areaToScreenRect } from '@/lib/template-engine/coordinates';

function getPositionInRegion(area: EditableAreaData, containerW: number, containerH: number, origW: number, origH: number) {
  const sr = areaToScreenRect(area, {
    templateImage: '',
    originalWidth: origW,
    originalHeight: origH,
    visibleBounds: null,
    containerWidth: containerW,
    containerHeight: containerH,
  });
  return sr;
}

export default function UploadTool() {
  const addLayer = useStudioStore((s) => s.addLayer);
  const updateLayer = useStudioStore((s) => s.updateLayer);
  const activeRegionId = useStudioStore((s) => s.activeRegionId);
  const editableRegions = useStudioStore((s) => s.editableRegions);
  const containerSize = useStudioStore((s) => s.canvasContainerSize);
  const origW = useStudioStore((s) => s.templateOriginalWidth);
  const origH = useStudioStore((s) => s.templateOriginalHeight);
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [recentUploads, setRecentUploads] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('dotbuild_recent_uploads') || '[]'); } catch { return []; }
  });

  const processFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB)'); return; }

    // Attach to active editable region if one is selected
    const activeRegion = editableRegions.find((r) => r.id === activeRegionId);
    let pos = { x: 50, y: 100, width: 200, height: 250 };
    if (activeRegion && containerSize.width > 0) {
      pos = getPositionInRegion(activeRegion, containerSize.width, containerSize.height, origW, origH);
    }

    setUploading(true);
    try {
      const compressedBlob = await compressImage(file, 1200, 0.8);
      const localUrl = URL.createObjectURL(compressedBlob);
      const layerId = addLayer({
        type: 'image',
        src: localUrl,
        originalSrc: localUrl,
        filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, hue: 0, sepia: 0, grayscale: 0 },
        opacity: 1, rotation: 0, x: pos.x, y: pos.y, width: pos.width, height: pos.height,
        visible: true, locked: false, name: activeRegion ? `${activeRegion.name} image` : 'Uploaded image',
        blendMode: 'normal', flipX: false, flipY: false,
        cornerRadius: 0,
      } as any);

      toast.success('Image added to canvas');

      let cloudUrl: string | null = null;
      try { cloudUrl = await uploadStudioImageBlob(compressedBlob, file.type === 'image/png' ? 'image/png' : 'image/jpeg'); } catch {}
      if (!cloudUrl) {
        try {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(compressedBlob);
          });
          cloudUrl = await uploadStudioImage(dataUrl);
        } catch {}
      }

      if (cloudUrl) {
        updateLayer(layerId, { src: cloudUrl, originalSrc: cloudUrl } as any);
        URL.revokeObjectURL(localUrl);
        setRecentUploads((prev) => {
          const next = [cloudUrl!, ...prev.filter((u) => u !== cloudUrl)].slice(0, 8);
          localStorage.setItem('dotbuild_recent_uploads', JSON.stringify(next));
          return next;
        });
      }
    } catch { toast.error('Failed to upload image'); }
    finally { setUploading(false); }
  };

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) await processFile(file);
      }
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(f => processFile(f));
  }, []);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className={cn(
          'group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 cursor-pointer',
          dragOver ? 'border-foreground bg-accent scale-[1.02]' : 'border-border bg-accent/30 hover:border-foreground/50 hover:bg-accent/50'
        )}
      >
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300',
          dragOver ? 'bg-foreground text-background scale-110' : 'bg-accent-foreground/10 text-muted-foreground group-hover:bg-foreground group-hover:text-background'
        )}>
          {uploading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {uploading ? 'Uploading...' : dragOver ? 'Drop images here' : 'Upload images'}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wider">
            PNG, JPG, WEBP · Max 10MB
          </p>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const files = e.target.files; if (files) Array.from(files).forEach(f => processFile(f)); }} />

      {/* Paste hint */}
      <div className="rounded-lg border border-border bg-accent/20 px-3 py-2 text-center">
        <p className="text-[10px] text-muted-foreground">
          <kbd className="rounded bg-accent-foreground/10 px-1 py-0.5 font-mono text-[9px]">Ctrl+V</kbd> to paste from clipboard
        </p>
      </div>

      {/* Recently uploaded */}
      {recentUploads.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recently uploaded</h4>
          <div className="grid grid-cols-4 gap-1.5">
            {recentUploads.map((url, idx) => (
              <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-accent/50 transition-all hover:border-foreground hover:shadow-md">
                <button
                  onClick={() => {
                    const activeRegion = editableRegions.find((r) => r.id === activeRegionId);
                    let pos = { x: 50, y: 100, width: 150, height: 200 };
                    if (activeRegion && containerSize.width > 0) {
                      pos = getPositionInRegion(activeRegion, containerSize.width, containerSize.height, origW, origH);
                    }
                    const layerId = addLayer({
                      type: 'image', src: url, originalSrc: url,
                      filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, hue: 0, sepia: 0, grayscale: 0 },
                      opacity: 1, rotation: 0, x: pos.x, y: pos.y, width: pos.width, height: pos.height,
                      visible: true, locked: false, name: activeRegion ? `${activeRegion.name} image` : `Upload ${idx + 1}`,
                      blendMode: 'normal', flipX: false, flipY: false, cornerRadius: 0,
                    } as any);
                    toast.success('Image added');
                  }}
                  className="block h-full w-full"
                >
                  <img src={url} alt="" className="h-full w-full object-cover pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none">
                    <Check className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setRecentUploads((prev) => { const next = prev.filter((u) => u !== url); localStorage.setItem('dotbuild_recent_uploads', JSON.stringify(next)); return next; }); }}
                  className="absolute top-0.5 right-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-error/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error"
                  title="Remove"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStudioStore } from '@/store/studioStore';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/Toast';
import { uploadStudioImageBlob } from '@/services/studioApi';
import { formatINR, cn } from '@/lib/utils';
import { CUSTOM_PRODUCT_ID } from '@/lib/constants';
import StudioCanvas from './canvas/StudioCanvas';
import LayersPanel from './panels/LayersPanel';
import RightProperties from './layout/RightProperties';
import UploadTool from './tools/UploadTool';
import TextTool from './tools/TextTool';
import StickersTool from './tools/StickersTool';
import {
  ArrowLeft, ShoppingBag, Check, Save, Download, Eye, Grid3X3, Moon, Sun,
  Undo2, Redo2, ZoomIn, ZoomOut, Upload, Type, Sticker, FolderHeart, Layers, X
} from 'lucide-react';
import Tooltip from './shared/Tooltip';

const TOOLS = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'stickers', label: 'Stickers', icon: Sticker },
  { id: 'saved', label: 'Saved', icon: FolderHeart },
];

export default function StudioPage() {
  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <DarkModeInit />
      <StudioHeader />
      <StudioMain />
    </div>
  );
}

function StudioHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart() as any;
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);

  const store = useStudioStore;
  const product = useStudioStore((s) => s.selectedProduct);
  const price = useStudioStore((s) => s.price);
  const settings = useStudioStore((s) => s.settings);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
  const canUndo = useStudioStore((s) => s.historyIndex >= 0);
  const canRedo = useStudioStore((s) => s.historyIndex < s.history.length - 2);
  const zoomIn = useStudioStore((s) => s.zoomIn);
  const zoomOut = useStudioStore((s) => s.zoomOut);
  const fitToScreen = useStudioStore((s) => s.fitToScreen);
  const toggleDarkMode = useStudioStore((s) => s.toggleDarkMode);
  const toggleGrid = useStudioStore((s) => s.toggleGrid);
  const back = useStudioStore((s) => s.leaveStudio);
  const saveDesign = useStudioStore((s) => s.saveDesign);

  const handleAddToBag = async () => {
    if (!user) { router.push('/login?redirect=/customize'); return; }
    try {
      setAdding(true);
      const captureFn = store.getState().captureRef;
      const dataUrl = captureFn ? await captureFn() : null;
      if (!dataUrl) { toast.error('Canvas capture failed'); return; }
      const blob = dataUrlToBlob(dataUrl);
      const cloudUrl = await uploadStudioImageBlob(blob, 'image/png');
      if (!cloudUrl) { toast.error('Image upload failed'); return; }
      const designData = {
        designId: `design_${Date.now()}`,
        createdAt: new Date().toISOString(),
        brand: store.getState().brand,
        modelId: store.getState().modelId,
        materialId: product?.materialId || store.getState().materialId,
        totalPrice: product?.price || price.total,
        thumbnail: cloudUrl,
        productId: product?.id || null,
        productName: product?.name || '',
      };
      await addItem(CUSTOM_PRODUCT_ID, 1, designData);
      store.getState().resetCanvas();
      localStorage.removeItem('dotbuild_recent_uploads');
      store.getState().leaveStudio();
      toast.success('Added to bag');
      router.push('/cart');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed');
    } finally { setAdding(false); }
  };

  const handleDownload = async () => {
    const captureFn = store.getState().captureRef;
    const dataUrl = captureFn ? await captureFn() : null;
    if (!dataUrl) { toast.error('Nothing to download'); return; }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'phone-case-design.png';
    a.click();
  };

  const handleSave = () => {
    saveDesign(product?.name || 'Design');
    setSaved(true);
    toast.success('Design saved');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background/80 backdrop-blur-xl z-50 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={back} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="h-5 w-px bg-border" />
        {product && (
          <div className="hidden md:flex items-center gap-1.5 text-xs">
            <span className="font-semibold truncate max-w-[120px]">{product.name}</span>
            <span className="text-muted-foreground">\u2022</span>
            <span className="font-bold">{formatINR(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-[10px] text-muted-foreground line-through">{formatINR(product.compareAtPrice)}</span>
            )}
          </div>
        )}
      </div>

      <div className="hidden md:flex items-center gap-0.5 rounded-xl border border-border bg-card p-0.5 shadow-sm">
        <Tooltip content="Undo (Ctrl+Z)">
          <button onClick={undo} disabled={!canUndo} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 transition-colors">
            <Undo2 className="h-4 w-4" />
          </button>
        </Tooltip>
        <Tooltip content="Redo (Ctrl+Shift+Z)">
          <button onClick={redo} disabled={!canRedo} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 transition-colors">
            <Redo2 className="h-4 w-4" />
          </button>
        </Tooltip>
        <div className="h-5 w-px bg-border mx-1" />
        <Tooltip content="Zoom Out">
          <button onClick={zoomOut} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <ZoomOut className="h-4 w-4" />
          </button>
        </Tooltip>
        <button onClick={fitToScreen} className="px-2 py-1 text-[11px] font-mono font-medium text-muted-foreground">
          {Math.round(settings.zoom * 100)}%
        </button>
        <Tooltip content="Zoom In">
          <button onClick={zoomIn} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <ZoomIn className="h-4 w-4" />
          </button>
        </Tooltip>
        <div className="h-5 w-px bg-border mx-1" />
        <Tooltip content="Grid">
          <button onClick={toggleGrid} className={cn('p-2 rounded-lg transition-colors', settings.showGrid ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}>
            <Grid3X3 className="h-4 w-4" />
          </button>
        </Tooltip>
        <Tooltip content="Dark Mode">
          <button onClick={toggleDarkMode} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            {settings.darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total</span>
          <span className="text-sm font-bold tabular-nums">{formatINR(product?.price || price.total)}</span>
        </div>
        <Tooltip content="Download">
          <button onClick={handleDownload} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </Tooltip>
        <Tooltip content="Save Design">
          <button onClick={handleSave} className={cn('p-2 rounded-lg transition-colors', saved ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}>
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          </button>
        </Tooltip>
        <button
          onClick={handleAddToBag}
          disabled={adding}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-foreground text-background text-xs font-semibold shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add to Cart</span>
          <span className="hidden md:inline">— {formatINR(product?.price || price.total)}</span>
        </button>
      </div>
    </header>
  );
}

function StudioMain() {
  useKeyboard();
  useAutoSave();
  const activeTool = useStudioStore((s) => s.activeTool);
  const setActiveTool = useStudioStore((s) => s.setActiveTool);
  const product = useStudioStore((s) => s.selectedProduct);
  const [layersOpen, setLayersOpen] = useState(true);
  const [mobilePanel, setMobilePanel] = useState(false);

  const editableRegions = useStudioStore((s) => s.editableRegions);
  const templateRegionsLoading = useStudioStore((s) => s.templateRegionsLoading);

  const renderMobileToolPanel = () => {
    switch (activeTool) {
      case 'upload': return <UploadTool />;
      case 'text': return <TextTool />;
      case 'stickers': return <StickersTool />;
      default: return null;
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-14 border-r border-border bg-background/80 backdrop-blur-xl shrink-0">
        <div className="flex flex-col items-center gap-1 py-3 px-1">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button key={tool.id} onClick={() => setActiveTool(isActive ? 'select' : tool.id)}
                className={cn('flex flex-col items-center gap-0.5 rounded-xl w-12 py-2 text-[7px] font-semibold uppercase tracking-wider transition-all duration-200',
                  isActive ? 'bg-foreground text-background shadow-lg scale-105' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50')}>
                <Icon className={cn('h-[16px] w-[16px]', isActive && 'scale-110')} />
                <span>{tool.label}</span>
              </button>
            );
          })}
          <button onClick={() => setLayersOpen(!layersOpen)}
            className={cn('flex flex-col items-center gap-0.5 rounded-xl w-12 py-2 text-[7px] font-semibold uppercase tracking-wider transition-all',
              layersOpen ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50')}>
            <Layers className="h-[16px] w-[16px]" />
            <span>Layers</span>
          </button>
        </div>
      </aside>

      {/* Product Info Panel */}
      {product && (
        <div className="hidden lg:flex flex-col w-[260px] border-r border-border bg-background/95 backdrop-blur-xl shrink-0 overflow-y-auto">
          <div className="p-3 border-b border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product Details</h3>
          </div>
          <div className="flex-1 p-4">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Name</p>
                <p className="text-sm font-semibold leading-snug">{product.name}</p>
              </div>

              <div className="flex items-baseline gap-2.5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Price</p>
                  <p className="text-lg font-bold">{formatINR(product.price)}</p>
                </div>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Was</p>
                    <p className="text-sm font-semibold line-through text-muted-foreground">{formatINR(product.compareAtPrice)}</p>
                  </div>
                )}
              </div>

              {product.discount && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Discount</p>
                  <p className="text-xs font-medium text-green-600 dark:text-green-400">{product.discount}</p>
                </div>
              )}

              {product.Material && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Material</p>
                  <p className="text-xs font-medium">{product.Material.name}</p>
                </div>
              )}

              {product.description && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Description</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{product.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {templateRegionsLoading && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-primary/10 text-primary text-[10px] font-medium px-3 py-1 rounded-full border border-primary/20">
            Loading template...
          </div>
        )}
        {editableRegions.length > 0 && !templateRegionsLoading && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-primary/10 text-primary text-[10px] font-medium px-3 py-1 rounded-full border border-primary/20 whitespace-nowrap">
            {editableRegions.length} editable {editableRegions.length === 1 ? 'region' : 'regions'} — customize within highlighted areas
          </div>
        )}
        <div className="flex-1 flex items-center justify-center overflow-auto p-4">
          <StudioCanvas />
        </div>
      </div>

      {/* Right Properties / Product Info Panel */}
      <RightProperties />

      {/* Layers Panel */}
      {layersOpen && (
        <div className="hidden lg:flex flex-col w-[240px] border-l border-border bg-background/95 backdrop-blur-xl shrink-0 animate-in slide-in-from-right">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Layers</h3>
            <button onClick={() => setLayersOpen(false)} className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <LayersPanel />
        </div>
      )}

      {/* Mobile bottom toolbar */}
      <MobileToolbar
        onToggleLayers={() => setLayersOpen(!layersOpen)}
        layersOpen={layersOpen}
        onOpenPanel={() => setMobilePanel(true)}
      />

      {/* Mobile tool panel */}
      {mobilePanel && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobilePanel(false)} />
          <div className="relative w-full max-h-[70vh] bg-background rounded-t-2xl border-t border-border shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground capitalize">{activeTool}</h3>
              <button onClick={() => setMobilePanel(false)} className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4">
              {renderMobileToolPanel()}
            </div>
          </div>
        </div>
      )}

      {/* Mobile layers panel */}
      {layersOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setLayersOpen(false)} />
          <div className="relative w-full max-h-[60vh] bg-background rounded-t-2xl border-t border-border shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Layers</h3>
              <button onClick={() => setLayersOpen(false)} className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[50vh]">
              <LayersPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileToolbar({ onToggleLayers, layersOpen, onOpenPanel }: { onToggleLayers: () => void; layersOpen: boolean; onOpenPanel: () => void }) {
  const activeTool = useStudioStore((s) => s.activeTool);
  const setActiveTool = useStudioStore((s) => s.setActiveTool);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-around px-2 py-2">
        {TOOLS.map((tool) => {
          const isActive = activeTool === tool.id;
          const Icon = tool.icon;
          return (
            <button key={tool.id} onClick={() => { setActiveTool(isActive ? 'select' : tool.id); onOpenPanel(); }}
              className={cn('flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[8px] font-semibold uppercase tracking-wider transition-all',
                isActive ? 'text-foreground bg-accent' : 'text-muted-foreground')}>
              <Icon className="h-4 w-4" />
              <span>{tool.label}</span>
            </button>
          );
        })}
        <button onClick={onToggleLayers}
          className={cn('flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[8px] font-semibold uppercase tracking-wider',
            layersOpen ? 'text-foreground bg-accent' : 'text-muted-foreground')}>
          <Layers className="h-4 w-4" />
          <span>Layers</span>
        </button>
      </div>
    </div>
  );
}

function DarkModeInit() {
  const darkMode = useStudioStore((s) => s.settings.darkMode);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);
  return null;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bytes = atob(parts[1]);
  const buffer = new ArrayBuffer(bytes.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) view[i] = bytes.charCodeAt(i);
  return new Blob([buffer], { type: mime });
}

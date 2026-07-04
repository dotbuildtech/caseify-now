'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudioStore } from '@/store/studioStore';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/Toast';
import { formatINR, cn } from '@/lib/utils';
import { CUSTOM_PRODUCT_ID } from '@/lib/constants';
import { ArrowLeft, ShoppingBag, Heart, Check, Sun, Moon, Save, Download, Eye, Grid3X3, Ruler, Undo2, Redo2, ZoomIn, ZoomOut } from 'lucide-react';
import Tooltip from '../shared/Tooltip';

export default function TopBar() {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart() as any;
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);

  const store = useStudioStore;
  const price = useStudioStore((s) => s.price);
  const settings = useStudioStore((s) => s.settings);
  const leaveStudio = useStudioStore((s) => s.leaveStudio);
  const setLandingStep = useStudioStore((s) => s.setLandingStep);

  const handleBack = () => {
    setLandingStep('templates');
    router.replace(`/customize?step=templates&brand=${encodeURIComponent(store.getState().brand || '')}&model=${encodeURIComponent(store.getState().modelId || '')}`, { scroll: false });
    leaveStudio();
  };
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
  const canUndo = useStudioStore((s) => s.historyIndex >= 0);
  const canRedo = useStudioStore((s) => s.historyIndex < s.history.length - 2);
  const zoomIn = useStudioStore((s) => s.zoomIn);
  const zoomOut = useStudioStore((s) => s.zoomOut);
  const fitToScreen = useStudioStore((s) => s.fitToScreen);
  const toggleDarkMode = useStudioStore((s) => s.toggleDarkMode);
  const toggleGrid = useStudioStore((s) => s.toggleGrid);
  const saveDesign = useStudioStore((s) => s.saveDesign);
  const resetView = useStudioStore((s) => s.resetView);

  const handleAddToBag = async () => {
    if (!user) { router.push('/login?redirect=/customize'); return; }
    setAdding(true);
    try {
      const thumbFn = store.getState().captureThumbRef;
      const thumbDataUrl = thumbFn ? await thumbFn() : null;
      if (!thumbDataUrl) { toast.error('Canvas capture failed'); setAdding(false); return; }

      const designData = {
        designId: `design_${Date.now()}`,
        createdAt: new Date().toISOString(),
        brand: store.getState().brand,
        modelId: store.getState().modelId,
        materialId: store.getState().materialId,
        totalPrice: price.total,
        thumbnail: thumbDataUrl,
      };

      addItem(CUSTOM_PRODUCT_ID, 1, designData).catch((err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to add to bag');
      });
      toast.success('Custom case added to bag');
      router.push('/cart');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to capture design');
    } finally { setAdding(false); }
  };

  const handleSave = () => {
    saveDesign();
    setSaved(true);
    toast.success('Design saved');
    setTimeout(() => setSaved(false), 2000);
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

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background/80 backdrop-blur-xl z-50 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="h-5 w-px bg-border" />
        <span className="text-sm font-semibold tracking-tight">Studio</span>
      </div>

      {/* Center - Toolbar */}
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
        <button onClick={fitToScreen} className="px-2 py-1 text-[11px] font-mono font-medium text-muted-foreground hover:text-foreground transition-colors">
          {Math.round(settings.zoom * 100)}%
        </button>
        <Tooltip content="Zoom In">
          <button onClick={zoomIn} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <ZoomIn className="h-4 w-4" />
          </button>
        </Tooltip>
        <div className="h-5 w-px bg-border mx-1" />
        <Tooltip content="Fit to Screen">
          <button onClick={fitToScreen} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Eye className="h-4 w-4" />
          </button>
        </Tooltip>
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

      {/* Right */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total</span>
          <span className="text-sm font-bold tabular-nums">{formatINR(price.total)}</span>
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
          <span className="hidden sm:inline">Add to Bag</span>
          <span className="hidden md:inline">— {formatINR(price.total)}</span>
        </button>
      </div>
    </header>
  );
}

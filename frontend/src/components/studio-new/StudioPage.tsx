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
  Undo2, Redo2, ZoomIn, ZoomOut, Upload, Type, Sticker, FolderHeart, Layers, X,
  Tag, Percent, Ticket, Info, Package, Sparkles, Smartphone
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
        materialId: product?.materialId || store.getState().materialId,
        totalPrice: product?.price || price.total,
        thumbnail: thumbDataUrl,
        productId: product?.id || null,
        productName: product?.name || '',
      };
      addItem(CUSTOM_PRODUCT_ID, 1, designData).catch((err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to add to cart');
      });
      store.getState().resetCanvas();
      localStorage.removeItem('dotbuild_recent_uploads');
      store.getState().leaveStudio();
      toast.success('Added to bag');
      router.push('/cart');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to capture design');
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
            <span className="text-muted-foreground">{'\u2022'}</span>
            <span className="font-bold tabular-nums">{formatINR(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <>
                <span className="text-[10px] text-muted-foreground line-through tabular-nums">{formatINR(product.compareAtPrice)}</span>
                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md">
                  -{Math.round((1 - product.price / product.compareAtPrice) * 100)}%
                </span>
              </>
            )}
            {price.discount > 0 && (
              <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-md">
                -{formatINR(price.discount)} off
              </span>
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
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total</span>
            <span className="text-sm font-bold tabular-nums">{formatINR(product?.price || price.total)}</span>
          </div>
          {price.discount > 0 && (
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <Percent className="h-3 w-3 text-green-600" />
              <span className="text-[10px] font-semibold text-green-600">-{formatINR(price.discount)} saved</span>
            </div>
          )}
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
    </header >
  );
}

function StudioMain() {
  useKeyboard();
  useAutoSave();
  const activeTool = useStudioStore((s) => s.activeTool);
  const setActiveTool = useStudioStore((s) => s.setActiveTool);
  const product = useStudioStore((s) => s.selectedProduct);
  const price = useStudioStore((s) => s.price);
  const brand = useStudioStore((s) => s.brand);
  const modelId = useStudioStore((s) => s.modelId);
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
        <div className="hidden lg:flex flex-col w-[280px] border-r border-border bg-card/80 backdrop-blur-xl shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Product Details</h3>
            </div>
          </div>
          <div className="flex-1 p-4 space-y-5 overflow-y-auto">
            {/* Product Image Preview */}
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-accent/30 border border-border">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1">
                <Smartphone className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium">{brand} {modelId}</span>
              </div>
            </div>

            {/* Product Name & Price */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold leading-snug">{product.name}</h4>
              <div className="flex items-baseline gap-2.5">
                <span className="text-xl font-bold tabular-nums">{formatINR(product.price)}</span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-sm text-muted-foreground line-through tabular-nums">{formatINR(product.compareAtPrice)}</span>
                )}
              </div>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-600 text-[11px] font-bold px-2.5 py-1 rounded-full border border-red-500/20">
                  <Percent className="h-3 w-3" />
                  {Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF — Save {formatINR(product.compareAtPrice - product.price)}
                </span>
              )}
            </div>

            {/* Material Badge */}
            {product.Material && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50 border border-border">
                <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Material</p>
                  <p className="text-xs font-semibold">{product.Material.name}</p>
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Description</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Discount / Coupon Section */}
            <div className="space-y-3 p-3.5 rounded-xl border-2 border-dashed border-border bg-accent/30">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold">Have a coupon?</span>
              </div>
              <CouponInput />
              {price.discount > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-[11px] font-medium text-green-700 dark:text-green-400">Discount applied</span>
                  </div>
                  <span className="text-xs font-bold text-green-600">-{formatINR(price.discount)}</span>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Enter a coupon code to apply additional savings to your custom case.
              </p>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Price Breakdown</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Price</span>
                  <span className="font-medium tabular-nums">{formatINR(price.base)}</span>
                </div>
                {price.material > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Material</span>
                    <span className="font-medium tabular-nums">+{formatINR(price.material)}</span>
                  </div>
                )}
                {price.premiumPrint > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Premium Print</span>
                    <span className="font-medium tabular-nums">+{formatINR(price.premiumPrint)}</span>
                  </div>
                )}
                {price.expressDelivery > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Express</span>
                    <span className="font-medium tabular-nums">+{formatINR(price.expressDelivery)}</span>
                  </div>
                )}
                {price.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium tabular-nums">-{formatINR(price.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold tabular-nums">{formatINR(price.total)}</span>
                </div>
              </div>
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

function CouponInput() {
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');
  const applyCoupon = useStudioStore((s) => s.applyCoupon);
  const discount = useStudioStore((s) => s.price.discount);
  const toast = useToast();

  const handleApply = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    if (trimmed === 'SAVE10') {
      applyCoupon(trimmed, 50);
      setApplied(true);
      setError('');
      toast.success('Coupon applied! You saved ₹50');
    } else if (trimmed === 'SAVE20') {
      applyCoupon(trimmed, 100);
      setApplied(true);
      setError('');
      toast.success('Coupon applied! You saved ₹100');
    } else if (trimmed === 'FLAT50') {
      applyCoupon(trimmed, 199);
      setApplied(true);
      setError('');
      toast.success('Coupon applied! You saved ₹199');
    } else {
      setError('Invalid coupon code');
      setApplied(false);
    }
  };

  const handleRemove = () => {
    applyCoupon(undefined, 0);
    setCode('');
    setApplied(false);
    setError('');
    toast.success('Coupon removed');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(''); }}
          placeholder="Enter code (e.g. SAVE10)"
          disabled={applied}
          className="flex-1 h-8 px-3 rounded-lg border border-border bg-background text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
        />
        {applied ? (
          <button
            onClick={handleRemove}
            className="h-8 px-3 rounded-lg bg-red-500/10 text-red-600 text-xs font-semibold border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            Remove
          </button>
        ) : (
          <button
            onClick={handleApply}
            disabled={!code.trim()}
            className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            Apply
          </button>
        )}
      </div>
      {applied && (
        <p className="text-[10px] text-green-600 font-medium">Coupon "{code}" applied!</p>
      )}
      {error && (
        <p className="text-[10px] text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
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

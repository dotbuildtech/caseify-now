'use client';
import { useStudioStore } from '@/store/studioStore';
import { CanvasLayer } from '@/types/studio';
import { cn } from '@/lib/utils';
import ImageProperties from '../properties/ImageProperties';
import TextProperties from '../properties/TextProperties';
import StickerProperties from '../properties/StickerProperties';
import ShapeProperties from '../properties/ShapeProperties';
import UploadTool from '../tools/UploadTool';
import TextTool from '../tools/TextTool';
import StickersTool from '../tools/StickersTool';
import { Layers, Lock, Unlock, Trash2, Copy, Eye, EyeOff, Upload, Type, Sticker, X } from 'lucide-react';

const TOOL_OPTIONS = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'stickers', label: 'Stickers', icon: Sticker },
];

export default function RightProperties() {
  const selectedLayerIds = useStudioStore((s) => s.selectedLayerIds);
  const layers = useStudioStore((s) => s.layers);
  const activeTool = useStudioStore((s) => s.activeTool);
  const setActiveTool = useStudioStore((s) => s.setActiveTool);
  const removeLayer = useStudioStore((s) => s.removeLayer);
  const duplicateLayer = useStudioStore((s) => s.duplicateLayer);
  const updateLayer = useStudioStore((s) => s.updateLayer);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const selectedLayer = selectedLayerIds.length === 1
    ? layers.find((l) => l.id === selectedLayerIds[0]) ?? null
    : null;

  const renderToolPanel = () => {
    switch (activeTool) {
      case 'upload': return <UploadTool />;
      case 'text': return <TextTool />;
      case 'stickers': return <StickersTool />;
      default: return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Layers className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-xs font-medium text-muted-foreground/60 mb-4">Choose a tool to add content</p>
          <div className="flex gap-2">
            {TOOL_OPTIONS.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setActiveTool(t.id)}
                  className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-border bg-accent/30 text-muted-foreground hover:text-foreground hover:border-foreground hover:bg-accent/50 transition-all">
                  <Icon className="h-5 w-5" />
                  <span className="text-[9px] font-semibold uppercase tracking-wider">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }
  };

  if (!selectedLayer) {
    return (
      <aside className="hidden xl:flex flex-col w-[320px] border-l border-border bg-background/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Content</h3>
          <button onClick={() => setActiveTool('select')} className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {renderToolPanel()}
        </div>
      </aside>
    );
  }

  const renderProperties = () => {
    switch (selectedLayer.type) {
      case 'image': return <ImageProperties layer={selectedLayer as any} />;
      case 'text': return <TextProperties layer={selectedLayer as any} />;
      case 'sticker': return <StickerProperties layer={selectedLayer as any} />;
      case 'shape': return <ShapeProperties layer={selectedLayer as any} />;
      default: return <p className="text-xs text-muted-foreground">No properties available</p>;
    }
  };

  return (
    <aside className="hidden xl:flex flex-col w-[320px] border-l border-border bg-background/80 backdrop-blur-xl shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium truncate">{selectedLayer.name || selectedLayer.type}</span>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground shrink-0 bg-accent px-1.5 py-0.5 rounded">{selectedLayer.type}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => { updateLayer(selectedLayer.id, { locked: !(selectedLayer as any).locked }); pushHistory('Toggle lock'); }}
            className={cn('p-1.5 rounded-md transition-colors', (selectedLayer as any).locked ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}
            title={selectedLayer.locked ? 'Unlock' : 'Lock'}
          >
            {(selectedLayer as any).locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => { updateLayer(selectedLayer.id, { visible: !selectedLayer.visible }); pushHistory('Toggle visibility'); }}
            className={cn('p-1.5 rounded-md transition-colors', !selectedLayer.visible ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}
            title={selectedLayer.visible ? 'Hide' : 'Show'}
          >
            {selectedLayer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => { duplicateLayer(selectedLayer.id); }} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Duplicate">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => { removeLayer(selectedLayer.id); }} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Properties */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderProperties()}
      </div>
    </aside>
  );
}

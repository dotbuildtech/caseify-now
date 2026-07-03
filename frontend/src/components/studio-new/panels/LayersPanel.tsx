'use client';
import { useStudioStore } from '@/store/studioStore';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Lock, Unlock, Trash2, Copy, ChevronUp, ChevronDown, GripVertical, Type, Image, Sticker, Shapes } from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = {
  text: <Type className="h-3 w-3" />,
  image: <Image className="h-3 w-3" />,
  sticker: <Sticker className="h-3 w-3" />,
  shape: <Shapes className="h-3 w-3" />,
  background: <Image className="h-3 w-3" />,
};

export default function LayersPanel() {
  const layers = useStudioStore((s) => s.layers);
  const selectedLayerIds = useStudioStore((s) => s.selectedLayerIds);
  const selectLayer = useStudioStore((s) => s.selectLayer);
  const updateLayer = useStudioStore((s) => s.updateLayer);
  const removeLayer = useStudioStore((s) => s.removeLayer);
  const duplicateLayer = useStudioStore((s) => s.duplicateLayer);
  const reorderLayer = useStudioStore((s) => s.reorderLayer);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const reversedLayers = [...layers].reverse();

  const handleVisibilityToggle = (id: string, currentVisible: boolean) => {
    updateLayer(id, { visible: !currentVisible });
    pushHistory('Toggle visibility');
  };

  const handleLockToggle = (id: string, currentLocked: boolean) => {
    updateLayer(id, { locked: !currentLocked } as any);
    pushHistory('Toggle lock');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Layers <span className="ml-1 font-normal normal-case text-muted-foreground/60">({layers.length})</span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-2xl mb-2 opacity-30">📄</div>
            <p className="text-[10px] text-muted-foreground/50">No layers yet</p>
            <p className="text-[9px] text-muted-foreground/40 mt-0.5">Add elements from the tools panel</p>
          </div>
        ) : (
          reversedLayers.map((layer) => {
            const isSelected = selectedLayerIds.includes(layer.id);
            const isLocked = (layer as any).locked || false;
            const isVisible = layer.visible;

            return (
              <div
                key={layer.id}
                onClick={() => selectLayer(layer.id, false)}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all group',
                  isSelected
                    ? 'bg-foreground text-background shadow-sm'
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                )}
              >
                <GripVertical className="h-3 w-3 shrink-0 opacity-30 group-hover:opacity-60 transition-opacity" />

                <div className="flex items-center justify-center h-7 w-7 rounded-md bg-background/50 shrink-0 overflow-hidden">
                  {layer.type === 'sticker' ? (
                    <span className="text-sm">{(layer as any).emoji || '😊'}</span>
                  ) : (
                    typeIcons[layer.type] || <Type className="h-3 w-3" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn('text-[11px] font-medium truncate', isSelected && 'text-background')}>
                    {layer.name || `${layer.type} layer`}
                  </p>
                  <p className={cn('text-[9px] truncate', isSelected ? 'text-background/60' : 'text-muted-foreground/60')}>
                    {layer.type}
                  </p>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleVisibilityToggle(layer.id, isVisible); }}
                    className={cn('p-1 rounded transition-colors', isSelected ? 'hover:bg-background/20' : 'hover:bg-accent-foreground/10')}
                  >
                    {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 opacity-50" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLockToggle(layer.id, isLocked); }}
                    className={cn('p-1 rounded transition-colors', isSelected ? 'hover:bg-background/20' : 'hover:bg-accent-foreground/10')}
                  >
                    {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3 opacity-50" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }}
                    className={cn('p-1 rounded transition-colors', isSelected ? 'hover:bg-background/20' : 'hover:bg-accent-foreground/10')}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                    className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); reorderLayer(layer.id, 'up'); }} className="p-0.5 rounded hover:bg-accent-foreground/10">
                    <ChevronUp className="h-2.5 w-2.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); reorderLayer(layer.id, 'down'); }} className="p-0.5 rounded hover:bg-accent-foreground/10">
                    <ChevronDown className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

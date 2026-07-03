'use client';
import { useStudioStore } from '@/store/studioStore';
import { cn } from '@/lib/utils';
import { Layers, History, Settings2 } from 'lucide-react';

interface BottomToolbarProps {
  onToggleLayers: () => void;
  layersOpen: boolean;
}

export default function BottomToolbar({ onToggleLayers, layersOpen }: BottomToolbarProps) {
  const settings = useStudioStore((s) => s.settings);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-around px-2 py-2">
        {/* Mobile tool tabs */}
        {['upload','text','stickers','shapes','background'].map((id) => {
          const active = useStudioStore((s) => s.activeTool) === id;
          const setTool = useStudioStore((s) => s.setActiveTool);
          return (
            <button
              key={id}
              onClick={() => setTool(id)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[8px] font-semibold uppercase tracking-wider transition-all',
                active ? 'text-foreground bg-accent' : 'text-muted-foreground'
              )}
            >
              <div className={cn('h-1 w-1 rounded-full transition-all', active ? 'bg-foreground' : 'bg-transparent')} />
              <span>{id}</span>
            </button>
          );
        })}
        <button
          onClick={onToggleLayers}
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[8px] font-semibold uppercase tracking-wider transition-all',
            layersOpen ? 'text-foreground bg-accent' : 'text-muted-foreground'
          )}
        >
          <Layers className="h-4 w-4" />
          <span>Layers</span>
        </button>
      </div>
    </div>
  );
}

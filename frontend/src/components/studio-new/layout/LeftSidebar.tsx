'use client';
import { useStudioStore } from '@/store/studioStore';
import { cn } from '@/lib/utils';
import { Upload, Type, Sticker, Shapes, Square, Layout, QrCode, Sparkles, FolderHeart } from 'lucide-react';

const TOOLS = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'stickers', label: 'Stickers', icon: Sticker },
  { id: 'shapes', label: 'Shapes', icon: Shapes },
  { id: 'background', label: 'Background', icon: Square },
  { id: 'templates', label: 'Templates', icon: Layout },
  { id: 'qr', label: 'QR Code', icon: QrCode },
  { id: 'ai', label: 'AI Image', icon: Sparkles },
  { id: 'saved', label: 'Saved', icon: FolderHeart },
];

export default function LeftSidebar() {
  const activeTool = useStudioStore((s) => s.activeTool);
  const setActiveTool = useStudioStore((s) => s.setActiveTool);

  return (
    <aside className="hidden lg:flex flex-col w-16 border-r border-border bg-background/80 backdrop-blur-xl shrink-0 overflow-y-auto">
      <div className="flex flex-col items-center gap-1 py-3 px-1">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl w-14 py-2.5 text-[8px] font-semibold uppercase tracking-wider transition-all duration-200',
                isActive
                  ? 'bg-foreground text-background shadow-lg shadow-foreground/20 scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon className={cn('h-[18px] w-[18px] transition-transform duration-200', isActive && 'scale-110')} />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

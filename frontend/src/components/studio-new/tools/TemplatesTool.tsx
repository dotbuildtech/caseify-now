'use client';
import { useEffect, useState } from 'react';
import { useStudioStore } from '@/store/studioStore';
import { fetchTemplates } from '@/services/studioApi';
import { cn } from '@/lib/utils';
import { Sparkles, ImageIcon } from 'lucide-react';

interface Template {
  id: string;
  label: string;
  thumb: string;
  category?: string;
  layers?: any[];
  bgColor?: string;
  bgImage?: string;
}

export default function TemplatesTool() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const addLayer = useStudioStore((s) => s.addLayer);
  const setBackgroundColor = useStudioStore((s) => s.setBackgroundColor);
  const setBackgroundImage = useStudioStore((s) => s.setBackgroundImage);
  const setLayers = useStudioStore((s) => s.setLayers);
  const pushHistory = useStudioStore((s) => s.pushHistory);
  const selectedProduct = useStudioStore((s) => s.selectedProduct);

  useEffect(() => {
    fetchTemplates()
      .then((data) => {
        const enriched = (data || []).map((t: Template, i: number) => ({
          ...t,
          category: t.category || ['Minimal', 'Floral', 'Bold', 'Gradient', 'Nature', 'Clean'][i % 6],
        }));
        setTemplates(enriched);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const applyTemplate = (tpl: Template) => {
    setActiveId(tpl.id);
    if (tpl.bgColor) setBackgroundColor(tpl.bgColor);
    if (tpl.bgImage) setBackgroundImage(tpl.bgImage);
    if (tpl.layers && tpl.layers.length > 0) {
      const newLayers = tpl.layers.map((l: any) => ({
        ...l,
        id: `layer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      }));
      setLayers(newLayers);
    }
    pushHistory('Apply template');
    setTimeout(() => setActiveId(null), 600);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold">Design Templates</h4>
          <p className="text-[10px] text-muted-foreground mt-0.5">Quick-start with pre-made layouts</p>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground bg-accent px-2 py-0.5 rounded-full">{templates.length}</span>
      </div>

      {selectedProduct && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-[11px] text-primary font-medium leading-tight">Templates designed for {selectedProduct.name}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/5] rounded-xl bg-accent animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-0.5">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => applyTemplate(tpl)}
              className={cn(
                'group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
                activeId === tpl.id && 'ring-2 ring-primary scale-[0.97]'
              )}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-accent/30">
                {tpl.thumb ? (
                  <img
                    src={tpl.thumb}
                    alt={tpl.label}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-xs font-semibold bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                    Apply Template
                  </span>
                </div>
              </div>
              <div className="px-2.5 py-2.5">
                <p className="text-xs font-semibold truncate">{tpl.label}</p>
                {tpl.category && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{tpl.category}</p>
                )}
              </div>
              {activeId === tpl.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-sm rounded-2xl">
                  <span className="text-xs font-bold text-primary">Applied!</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

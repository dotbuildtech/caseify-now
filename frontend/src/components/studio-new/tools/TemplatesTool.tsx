'use client';
import { useEffect, useState } from 'react';
import { useStudioStore } from '@/store/studioStore';
import { fetchTemplates } from '@/services/studioApi';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  label: string;
  thumb: string;
  layers?: any[];
  bgColor?: string;
  bgImage?: string;
}

export default function TemplatesTool() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const addLayer = useStudioStore((s) => s.addLayer);
  const setBackgroundColor = useStudioStore((s) => s.setBackgroundColor);
  const setBackgroundImage = useStudioStore((s) => s.setBackgroundImage);
  const setLayers = useStudioStore((s) => s.setLayers);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  useEffect(() => {
    fetchTemplates().then((data) => { setTemplates(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const applyTemplate = (tpl: Template) => {
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
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Design Templates</h4>
        <span className="text-[9px] text-muted-foreground/60">{templates.length} templates</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {[1,2,3,4].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-accent animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => applyTemplate(tpl)}
              className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-accent/30 transition-all hover:border-foreground hover:shadow-lg hover:-translate-y-0.5"
            >
              <img
                src={tpl.thumb}
                alt={tpl.label}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-[10px] font-semibold text-white drop-shadow">{tpl.label}</p>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

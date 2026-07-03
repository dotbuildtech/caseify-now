'use client';
import { useState } from 'react';
import { useStudioStore } from '@/store/studioStore';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

const SUGGESTIONS = [
  'Pastel floral pattern',
  'Neon geometric shapes',
  'Galaxy space theme',
  'Tropical leaves',
  'Minimal marble texture',
  'Watercolor abstract',
  'Vaporwave sunset',
  'Cyberpunk cityscape',
];

const STYLE_IMAGES: Record<string, string[]> = {
  floral: [
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400',
    'https://images.unsplash.com/photo-1496062031456-07b8f162a322?w=400',
  ],
  neon: [
    'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400',
  ],
  galaxy: [
    'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400',
    'https://images.unsplash.com/photo-1544126592-54f5e1a2ac3e?w=400',
  ],
  tropical: [
    'https://images.unsplash.com/photo-1559827291-baf8b44c47ff?w=400',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
  ],
  marble: [
    'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400',
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400',
  ],
  watercolor: [
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
    'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400',
  ],
  vaporwave: [
    'https://images.unsplash.com/photo-1563089145-599f858dca97?w=400',
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=400',
  ],
  cyberpunk: [
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400',
    'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=400',
  ],
};

export default function AITool() {
  const addLayer = useStudioStore((s) => s.addLayer);
  const setBackgroundImage = useStudioStore((s) => s.setBackgroundImage);
  const toast = useToast();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<{ primary: string; variants: string[] } | null>(null);

  const matchStyle = (p: string): string[] => {
    const lower = p.toLowerCase();
    for (const [key, urls] of Object.entries(STYLE_IMAGES)) {
      if (lower.includes(key)) return urls;
    }
    if (lower.includes('abstract') || lower.includes('pattern')) return STYLE_IMAGES.watercolor;
    if (lower.includes('dark') || lower.includes('black')) return STYLE_IMAGES.galaxy;
    if (lower.includes('bright') || lower.includes('colorful')) return STYLE_IMAGES.vaporwave;
    return STYLE_IMAGES.marble;
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    // Simulate AI generation delay
    await new Promise((r) => setTimeout(r, 1500));
    const images = matchStyle(prompt);
    setResults({
      primary: images[0] || STYLE_IMAGES.marble[0],
      variants: images.slice(1).concat(STYLE_IMAGES.abstract.slice(0, 3)).slice(0, 3),
    });
    setGenerating(false);
  };

  const applyAsBackground = (url: string) => {
    setBackgroundImage(url);
    toast.success('AI design applied as background');
  };

  const applyAsLayer = (url: string) => {
    addLayer({
      type: 'image', src: url, originalSrc: url,
      filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, hue: 0, sepia: 0, grayscale: 0 },
      opacity: 1, rotation: 0, x: 50, y: 100, width: 250, height: 300,
      visible: true, locked: false, name: 'AI Generated',
      blendMode: 'normal', flipX: false, flipY: false, cornerRadius: 0,
    } as any);
    toast.success('AI design added as layer');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-accent/30">
        <Sparkles className="h-6 w-6 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">AI Image Generator</p>
          <p className="text-[10px] text-muted-foreground">Describe your design and let AI create it</p>
        </div>
      </div>

      {/* Prompt input */}
      <div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your design... e.g. 'Pastel floral pattern with butterflies'"
          className="w-full h-20 rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-foreground resize-none"
        />
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => { setPrompt(s); }} className="rounded-full border border-border bg-accent/30 px-2.5 py-1 text-[9px] font-medium text-muted-foreground transition-all hover:border-foreground hover:text-foreground">
            {s}
          </button>
        ))}
      </div>

      {/* Generate button */}
      <button onClick={generate} disabled={generating || !prompt.trim()}
        className="w-full h-10 rounded-xl bg-foreground text-background text-xs font-semibold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
        {generating ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</>
        ) : (
          <><Sparkles className="h-3.5 w-3.5" /> Generate Design</>
        )}
      </button>

      {/* Results */}
      {results && (
        <div className="space-y-3 animate-fadeIn">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Generated Results</h4>
          <div className="space-y-2">
            <button onClick={() => applyAsBackground(results.primary)} className="group relative w-full aspect-[4/3] rounded-xl overflow-hidden border-2 border-foreground/20 transition-all hover:border-foreground">
              <img src={results.primary} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                <span className="text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity">Set as Background</span>
              </div>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {results.variants.map((v, i) => (
              <button key={i} onClick={() => applyAsLayer(v)} className="group relative aspect-square rounded-lg overflow-hidden border border-border transition-all hover:border-foreground">
                <img src={v} alt="" className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                  <span className="text-[8px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity">Add Layer</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

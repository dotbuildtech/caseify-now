'use client';
import { useState } from 'react';
import { useStudioStore } from '@/store/studioStore';
import type { SavedDesign } from '@/types/studio';
import { cn } from '@/lib/utils';
import { Trash2, FolderHeart, ExternalLink } from 'lucide-react';

export default function SavedDesignsTool() {
  const savedDesigns = useStudioStore((s) => s.savedDesigns);
  const loadDesign = useStudioStore((s) => s.loadDesign);
  const deleteDesign = useStudioStore((s) => s.deleteDesign);
  const exportJSON = useStudioStore((s) => s.exportJSON);
  const importJSON = useStudioStore((s) => s.importJSON);
  const resetCanvas = useStudioStore((s) => s.resetCanvas);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleExport = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phone-case-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try { importJSON(importText); setImportText(''); setShowImport(false); } catch { alert('Invalid JSON'); }
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={handleExport} className="flex-1 h-8 rounded-lg border border-border text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground transition-all">
          Export JSON
        </button>
        <button onClick={() => setShowImport(!showImport)} className="flex-1 h-8 rounded-lg border border-border text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground transition-all">
          Import JSON
        </button>
        <button onClick={resetCanvas} className="flex-1 h-8 rounded-lg border border-destructive/30 text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-all">
          Reset
        </button>
      </div>

      {showImport && (
        <div className="space-y-2">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste JSON here..."
            className="w-full h-24 rounded-lg border border-border bg-background p-2.5 text-[10px] font-mono outline-none focus:border-foreground resize-none"
          />
          <button onClick={handleImport} className="w-full h-8 rounded-lg bg-foreground text-background text-[10px] font-semibold transition-all hover:opacity-90">
            Import
          </button>
        </div>
      )}

      {/* Empty state */}
      {savedDesigns.length === 0 && !showImport && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FolderHeart className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-xs text-muted-foreground/60">No saved designs yet</p>
          <p className="text-[10px] text-muted-foreground/40 mt-1">Click Save in the top bar to save your designs</p>
        </div>
      )}

      {/* Saved designs list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {savedDesigns.map((design) => (
          <div key={design.id}
            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-accent/20 transition-all hover:border-foreground group">
            <div className="h-12 w-12 shrink-0 rounded-lg bg-accent overflow-hidden">
              {design.thumbnail ? (
                <img src={design.thumbnail} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground/40 text-lg">📱</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{design.name}</p>
              <p className="text-[9px] text-muted-foreground/60 truncate">
                {design.brand || 'Custom'} · {new Date(design.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => loadDesign(design)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Load">
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => deleteDesign(design.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

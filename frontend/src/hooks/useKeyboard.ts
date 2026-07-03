'use client';
import { useEffect } from 'react';
import { useStudioStore } from '@/store/studioStore';

export function useKeyboard() {
  const store = useStudioStore;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      if (ctrl && e.key === 'z' && !shift) { e.preventDefault(); store.getState().undo(); }
      else if (ctrl && shift && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); store.getState().redo(); }
      else if (ctrl && e.key === 'c') { /* copy handled separately */ }
      else if (ctrl && e.key === 'v') { /* paste handled separately */ }
      else if (e.key === 'Delete' || e.key === 'Backspace') { store.getState().removeSelectedLayers(); }
      else if (ctrl && e.key === 'a') { e.preventDefault(); store.getState().selectAll(); }
      else if (ctrl && e.key === 'd') { e.preventDefault(); store.getState().duplicateSelected(); }
      else if (ctrl && e.key === '=') { e.preventDefault(); store.getState().zoomIn(); }
      else if (ctrl && e.key === '-') { e.preventDefault(); store.getState().zoomOut(); }
      else if (ctrl && e.key === '0') { e.preventDefault(); store.getState().fitToScreen(); }
      else if (ctrl && e.key === 's') { e.preventDefault(); store.getState().saveDesign(); }
      else if (ctrl && e.key === 'g' && !shift) { e.preventDefault(); }
      else if (ctrl && shift && e.key === 'g') { e.preventDefault(); }

      // Arrow keys for nudge
      const step = shift ? 10 : 1;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const state = store.getState();
        const selIds = state.selectedLayerIds;
        if (selIds.length === 0) return;
        selIds.forEach((id) => {
          const layer = state.layers.find(l => l.id === id);
          if (!layer || (layer as any).locked) return;
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
          state.updateLayer(id, { x: ((layer as any).x || 0) + dx, y: ((layer as any).y || 0) + dy });
        });
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}

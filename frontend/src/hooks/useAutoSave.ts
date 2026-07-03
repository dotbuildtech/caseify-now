'use client';
import { useEffect } from 'react';
import { useStudioStore } from '@/store/studioStore';

export function useAutoSave() {
  const settings = useStudioStore((s) => s.settings);
  const layers = useStudioStore((s) => s.layers);
  const background = useStudioStore((s) => s.background);

  useEffect(() => {
    if (!settings.autoSave) return;
    const timer = setInterval(() => {
      const state = useStudioStore.getState();
      const data = {
        layers: state.layers,
        background: state.background,
        brand: state.brand,
        modelId: state.modelId,
        materialId: state.materialId,
      };
      try { localStorage.setItem('dotbuild_autosave', JSON.stringify(data)); } catch {}
    }, settings.autoSaveInterval);
    return () => clearInterval(timer);
  }, [settings.autoSave, settings.autoSaveInterval, layers, background]);
}

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  CanvasLayer, ImageLayer, StickerLayer, ShapeLayer,
  BackgroundLayer, DeviceModel, Material, Brand, DeviceTemplate,
  HistoryEntry, StudioSettings, PriceBreakdown, SavedDesign,
  EditableAreaData, VisibleBoundsData, PhoneTemplate, DesignDocument
} from '@/types/studio';
import { generateId, clamp, matrixFromTransform } from '@/lib/utils';
import type { TransformMatrix } from '@/lib/utils';
import { HISTORY_LIMIT, AUTOSAVE_INTERVAL, SAVED_DESIGNS_KEY, STUDIO_SETTINGS_KEY } from '@/lib/constants';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const defaultSettings: StudioSettings = {
  showGrid: false, snapToGrid: true, snapToObjects: true,
  showSafeZone: true, showBleedArea: false,
  zoom: 1, panX: 0, panY: 0, darkMode: false,
  rulerEnabled: false, autoSave: true, autoSaveInterval: AUTOSAVE_INTERVAL,
};

const defaultBackground: BackgroundLayer = {
  id: 'bg_default', type: 'background', name: 'Background',
  fillType: 'solid', color: '#F4F4F5',
  opacity: 1, visible: true, locked: true,
};

interface StudioState {
  selectedProduct: any | null;

  brand: string | null;
  brands: Brand[];
  brandsLoading: boolean;
  modelId: string | null;
  models: DeviceModel[];
  modelsLoading: boolean;
  template: DeviceTemplate | null;
  templateLoading: boolean;
  materialId: string | null;
  materials: Material[];
  materialsLoading: boolean;

  editableRegions: EditableAreaData[];
  visibleBounds: VisibleBoundsData | null;
  templateRegionsLoading: boolean;
  activeRegionId: number | null;
  canvasContainerSize: { width: number; height: number };
  templateOriginalWidth: number;
  templateOriginalHeight: number;

  phoneTemplate: PhoneTemplate | null;

  layers: CanvasLayer[];
  selectedLayerIds: string[];
  background: BackgroundLayer;

  activeTool: string;
  activeTab: string;

  history: HistoryEntry[];
  historyIndex: number;
  isUndoRedoing: boolean;

  price: PriceBreakdown;

  inStudio: boolean;

  settings: StudioSettings;

  savedDesigns: SavedDesign[];

  captureRef: (() => Promise<string | null>) | null;
  captureThumbRef: (() => Promise<string | null>) | null;

  landingStep: 'brands' | 'models' | 'templates' | null;
  landingBrandName: string | null;
  landingModelId: number | null;

  printFile: string | null;
  printGenerating: boolean;

  setSelectedProduct: (product: any | null) => void;
  setBrand: (brand: string | null) => void;
  setBrands: (brands: Brand[]) => void;
  setBrandsLoading: (loading: boolean) => void;
  setModelId: (id: string | null) => void;
  setModels: (models: DeviceModel[]) => void;
  setModelsLoading: (loading: boolean) => void;
  setTemplate: (template: DeviceTemplate | null) => void;
  setTemplateLoading: (loading: boolean) => void;
  setMaterialId: (id: string | null) => void;
  setMaterials: (materials: Material[]) => void;
  setMaterialsLoading: (loading: boolean) => void;

  setEditableRegions: (regions: EditableAreaData[]) => void;
  setVisibleBounds: (bounds: VisibleBoundsData | null) => void;
  setTemplateRegionsLoading: (loading: boolean) => void;
  setActiveRegionId: (id: number | null) => void;
  setCanvasContainerSize: (size: { width: number; height: number }) => void;
  setTemplateOriginalDimensions: (width: number, height: number) => void;

  setPhoneTemplate: (phoneTemplate: PhoneTemplate | null) => void;

  addLayer: (layer: Omit<CanvasLayer, 'id'> & { type: CanvasLayer['type'] }) => string;
  updateLayer: (id: string, patch: Record<string, any>) => void;
  removeLayer: (id: string) => void;
  removeSelectedLayers: () => void;
  duplicateLayer: (id: string) => string | null;
  duplicateSelected: () => void;
  reorderLayer: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  setLayers: (layers: CanvasLayer[]) => void;

  selectLayer: (id: string | null, multi?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  getSelectedLayer: () => CanvasLayer | null;
  getSelectedLayers: () => CanvasLayer[];

  setBackground: (patch: Partial<BackgroundLayer>) => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundImage: (src: string | null) => void;
  setBackgroundGradient: (start: string, end: string, angle: number) => void;

  setActiveTool: (tool: string) => void;
  setActiveTab: (tab: string) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: (description?: string) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  setPrice: (price: Partial<PriceBreakdown>) => void;
  calculatePrice: () => void;
  applyCoupon: (code: string | undefined, discount: number) => void;

  setSetting: <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => void;
  toggleDarkMode: () => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
  resetView: () => void;

  saveDesign: (name?: string) => void;
  loadDesign: (design: SavedDesign) => void;
  deleteDesign: (id: string) => void;

  setCaptureRef: (ref: (() => Promise<string | null>) | null) => void;
  setCaptureThumbRef: (ref: (() => Promise<string | null>) | null) => void;

  enterStudio: () => void;
  leaveStudio: () => void;
  setLandingStep: (step: 'brands' | 'models' | 'templates' | null) => void;
  setLandingBrandName: (name: string | null) => void;
  setLandingModelId: (id: number | null) => void;

  exportJSON: () => string;
  importJSON: (json: string) => void;
  resetCanvas: () => void;

  generatePrintFile: () => Promise<string | null>;
  setPrintFile: (url: string | null) => void;
  setPrintGenerating: (generating: boolean) => void;
  toDesignDocument: () => DesignDocument;
}

export const useStudioStore = create<StudioState>()(
  subscribeWithSelector((set, get) => ({
    selectedProduct: null,
    brand: null,
    brands: [],
    brandsLoading: false,
    modelId: null,
    models: [],
    modelsLoading: false,
    template: null,
    templateLoading: false,
    materialId: null,
    materials: [],
    materialsLoading: false,

    editableRegions: [],
    visibleBounds: null,
    templateRegionsLoading: false,
    activeRegionId: null,
    canvasContainerSize: { width: 300, height: 650 },
    templateOriginalWidth: 3000,
    templateOriginalHeight: 3000,

    phoneTemplate: null,

    layers: [],
    selectedLayerIds: [],
    background: { ...defaultBackground },

    activeTool: 'select',
    activeTab: 'upload',

    history: [],
    historyIndex: -1,
    isUndoRedoing: false,

    price: { base: 399, material: 0, premiumPrint: 0, expressDelivery: 0, discount: 0, total: 399 },

    inStudio: false,

    settings: loadFromStorage(STUDIO_SETTINGS_KEY, defaultSettings),

    savedDesigns: loadFromStorage<SavedDesign[]>(SAVED_DESIGNS_KEY, []),

    captureRef: null,
    captureThumbRef: null,

    landingStep: null,
    landingBrandName: null,
    landingModelId: null,

    printFile: null,
    printGenerating: false,

    setSelectedProduct: (product) => set({ selectedProduct: product }),
    setBrand: (brand) => set({ brand, modelId: null, materialId: null }),
    setBrands: (brands) => set({ brands, brandsLoading: false }),
    setBrandsLoading: (brandsLoading) => set({ brandsLoading }),
    setModelId: (modelId) => set({ modelId, materialId: null }),
    setModels: (models) => set({ models, modelsLoading: false }),
    setModelsLoading: (modelsLoading) => set({ modelsLoading }),
    setTemplate: (template) => set({ template, templateLoading: false }),
    setTemplateLoading: (templateLoading) => set({ templateLoading }),
    setMaterialId: (materialId) => set({ materialId }),
    setMaterials: (materials) => set({ materials, materialsLoading: false }),
    setMaterialsLoading: (materialsLoading) => set({ materialsLoading }),
    setEditableRegions: (editableRegions) => set({ editableRegions, templateRegionsLoading: false }),
    setVisibleBounds: (visibleBounds) => set({ visibleBounds }),
    setTemplateRegionsLoading: (templateRegionsLoading) => set({ templateRegionsLoading }),
    setActiveRegionId: (activeRegionId) => set({ activeRegionId }),
    setCanvasContainerSize: (canvasContainerSize) => set({ canvasContainerSize }),
    setTemplateOriginalDimensions: (width, height) => set({ templateOriginalWidth: width, templateOriginalHeight: height }),

    setPhoneTemplate: (phoneTemplate) => set({ phoneTemplate }),

    addLayer: (layerData) => {
      const id = generateId();
      const layer = { ...layerData, id } as CanvasLayer;
      set((state) => {
        const newLayers = [...state.layers, layer];
        return { layers: newLayers, selectedLayerIds: [id] };
      });
      get().pushHistory('Add layer');
      return id;
    },

    updateLayer: (id, patch) => {
      set((state) => ({
        layers: state.layers.map((l) => (l.id === id ? { ...l, ...patch } as CanvasLayer : l)),
      }));
    },

    removeLayer: (id) => {
      set((state) => ({
        layers: state.layers.filter((l) => l.id !== id),
        selectedLayerIds: state.selectedLayerIds.filter((sid) => sid !== id),
      }));
      get().pushHistory('Remove layer');
    },

    removeSelectedLayers: () => {
      const { selectedLayerIds } = get();
      if (selectedLayerIds.length === 0) return;
      set((state) => ({
        layers: state.layers.filter((l) => !selectedLayerIds.includes(l.id)),
        selectedLayerIds: [],
      }));
      get().pushHistory('Remove selected layers');
    },

    duplicateLayer: (id) => {
      const state = get();
      const source = state.layers.find((l) => l.id === id);
      if (!source) return null;
      const newId = generateId();
      const s = source as any;
      const newLayer = { ...s, id: newId, x: (s.x || 0) + 20, y: (s.y || 0) + 20, name: `${s.name} copy` } as CanvasLayer;
      set((s) => ({ layers: [...s.layers, newLayer], selectedLayerIds: [newId] }));
      get().pushHistory('Duplicate layer');
      return newId;
    },

    duplicateSelected: () => {
      const state = get();
      state.selectedLayerIds.forEach((id) => state.duplicateLayer(id));
    },

    reorderLayer: (id, direction) => {
      set((state) => {
        const idx = state.layers.findIndex((l) => l.id === id);
        if (idx < 0) return state;
        const newLayers = [...state.layers];
        const [item] = newLayers.splice(idx, 1);
        let newIdx = idx;
        if (direction === 'up') newIdx = Math.min(idx + 1, newLayers.length);
        else if (direction === 'down') newIdx = Math.max(0, idx - 1);
        else if (direction === 'top') newIdx = newLayers.length;
        else if (direction === 'bottom') newIdx = 0;
        newLayers.splice(newIdx, 0, item);
        return { layers: newLayers };
      });
      get().pushHistory('Reorder layer');
    },

    setLayers: (layers) => set({ layers }),

    selectLayer: (id, multi = false) => {
      set((state) => {
        if (id === null) return { selectedLayerIds: [] };
        if (multi) {
          const has = state.selectedLayerIds.includes(id);
          return {
            selectedLayerIds: has
              ? state.selectedLayerIds.filter((sid) => sid !== id)
              : [...state.selectedLayerIds, id],
          };
        }
        return { selectedLayerIds: [id] };
      });
    },

    selectAll: () => {
      set((state) => ({
        selectedLayerIds: state.layers.filter((l) => !l.locked).map((l) => l.id),
      }));
    },

    clearSelection: () => set({ selectedLayerIds: [] }),

    getSelectedLayer: () => {
      const state = get();
      const id = state.selectedLayerIds[0];
      return id ? state.layers.find((l) => l.id === id) ?? null : null;
    },

    getSelectedLayers: () => {
      const state = get();
      return state.layers.filter((l) => state.selectedLayerIds.includes(l.id));
    },

    setBackground: (patch) => set((state) => ({ background: { ...state.background, ...patch } })),
    setBackgroundColor: (color) => set((state) => ({ background: { ...state.background, fillType: 'solid', color, imageSrc: undefined } })),
    setBackgroundImage: (src) => set((state) => ({ background: { ...state.background, fillType: src ? 'image' : 'solid', imageSrc: src ?? undefined, color: src ? undefined : '#F4F4F5' } })),
    setBackgroundGradient: (start, end, angle) => set((state) => ({ background: { ...state.background, fillType: 'gradient', gradientStart: start, gradientEnd: end, gradientAngle: angle, imageSrc: undefined } })),

    setActiveTool: (tool) => set({ activeTool: tool }),
    setActiveTab: (tab) => set({ activeTab: tab }),

    undo: () => {
      const { historyIndex, history } = get();
      if (historyIndex < 0) return;
      const entry = history[historyIndex];
      if (!entry) return;
      set({ isUndoRedoing: true, layers: JSON.parse(JSON.stringify(entry.layers)), historyIndex: historyIndex - 1 });
      setTimeout(() => set({ isUndoRedoing: false }), 50);
    },

    redo: () => {
      const { historyIndex, history } = get();
      if (historyIndex >= history.length - 2) return;
      const entry = history[historyIndex + 2];
      if (!entry) return;
      set({ isUndoRedoing: true, layers: JSON.parse(JSON.stringify(entry.layers)), historyIndex: historyIndex + 1 });
      setTimeout(() => set({ isUndoRedoing: false }), 50);
    },

    pushHistory: (description = 'Edit') => {
      const state = get();
      if (state.isUndoRedoing) return;
      const snapshot = { layers: JSON.parse(JSON.stringify(state.layers)), timestamp: Date.now(), description };
      set((s) => {
        const trimmed = s.history.slice(0, s.historyIndex + 1);
        const next = [...trimmed, snapshot];
        if (next.length > HISTORY_LIMIT) next.shift();
        return { history: next, historyIndex: Math.min(next.length - 1, HISTORY_LIMIT - 1) };
      });
    },

    canUndo: () => get().historyIndex >= 0,
    canRedo: () => get().historyIndex < get().history.length - 2,

    setPrice: (price) => set((state) => ({ price: { ...state.price, ...price } })),
    calculatePrice: () => {
      const state = get();
      const base = state.template?.basePrice ?? 399;
      const materialPrice = state.materials.find(m => m.id === state.materialId)?.price ?? 0;
      const layerCount = state.layers.length;
      const premiumPrint = layerCount > 3 ? 99 : 0;
      const total = base + materialPrice + premiumPrint + state.price.expressDelivery - state.price.discount;
      set({ price: { ...state.price, base, material: materialPrice, premiumPrint, total: Math.max(total, 0) } });
    },

    applyCoupon: (code, discountAmount) => {
      set((state) => {
        const newPrice = {
          ...state.price,
          discount: discountAmount,
          couponCode: code,
        };
        const base = state.template?.basePrice ?? 399;
        const materialPrice = state.materials.find(m => m.id === state.materialId)?.price ?? 0;
        const layerCount = state.layers.length;
        const premiumPrint = layerCount > 3 ? 99 : 0;
        const total = base + materialPrice + premiumPrint + newPrice.expressDelivery - newPrice.discount;
        newPrice.base = base;
        newPrice.material = materialPrice;
        newPrice.premiumPrint = premiumPrint;
        newPrice.total = Math.max(total, 0);
        return { price: newPrice };
      });
    },

    setSetting: (key, value) => set((state) => {
      const settings = { ...state.settings, [key]: value };
      saveToStorage(STUDIO_SETTINGS_KEY, settings);
      return { settings };
    }),
    toggleDarkMode: () => {
      const state = get();
      const darkMode = !state.settings.darkMode;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', darkMode);
      }
      state.setSetting('darkMode', darkMode);
    },
    toggleGrid: () => get().setSetting('showGrid', !get().settings.showGrid),
    toggleSnap: () => get().setSetting('snapToGrid', !get().settings.snapToGrid),
    setZoom: (zoom) => get().setSetting('zoom', clamp(zoom, 0.1, 5)),
    setPan: (x, y) => set((state) => ({ settings: { ...state.settings, panX: x, panY: y } })),
    zoomIn: () => { const state = get(); state.setZoom(state.settings.zoom + 0.1); },
    zoomOut: () => { const state = get(); state.setZoom(state.settings.zoom - 0.1); },
    fitToScreen: () => set((state) => ({ settings: { ...state.settings, zoom: 1, panX: 0, panY: 0 } })),
    resetView: () => set((state) => ({ settings: { ...state.settings, zoom: 1, panX: 0, panY: 0 } })),

    saveDesign: (name) => {
      const state = get();
      const design: SavedDesign = {
        id: generateId(),
        name: name || `Design ${state.savedDesigns.length + 1}`,
        createdAt: new Date().toISOString(),
        brand: state.brand ?? undefined,
        modelId: state.modelId ?? undefined,
        materialId: state.materialId ?? undefined,
        layers: state.layers,
        background: state.background,
      };
      const saved = [design, ...state.savedDesigns].slice(0, 50);
      saveToStorage(SAVED_DESIGNS_KEY, saved);
      set({ savedDesigns: saved });
    },

    loadDesign: (design) => {
      set({
        layers: design.layers,
        background: design.background,
        brand: design.brand ?? null,
        modelId: design.modelId ?? null,
        materialId: design.materialId ?? null,
        selectedLayerIds: [],
      });
      get().pushHistory('Load design');
    },

    deleteDesign: (id) => {
      const saved = get().savedDesigns.filter((d) => d.id !== id);
      saveToStorage(SAVED_DESIGNS_KEY, saved);
      set({ savedDesigns: saved });
    },

    setCaptureRef: (ref) => set({ captureRef: ref }),
    setCaptureThumbRef: (ref) => set({ captureThumbRef: ref }),

    enterStudio: () => set({ inStudio: true }),
    leaveStudio: () => set({ inStudio: false }),
    setLandingStep: (step) => set({ landingStep: step }),
    setLandingBrandName: (name) => set({ landingBrandName: name }),
    setLandingModelId: (id) => set({ landingModelId: id }),

    exportJSON: () => {
      const state = get();
      return JSON.stringify({ layers: state.layers, background: state.background, brand: state.brand, modelId: state.modelId, materialId: state.materialId }, null, 2);
    },

    importJSON: (json) => {
      try {
        const data = JSON.parse(json);
        set({
          layers: data.layers || [],
          background: data.background || { ...defaultBackground },
          brand: data.brand ?? null,
          modelId: data.modelId ?? null,
          materialId: data.materialId ?? null,
        });
        get().pushHistory('Import design');
      } catch { console.error('Invalid JSON import'); }
    },

    resetCanvas: () => {
      set({
        layers: [],
        selectedLayerIds: [],
        background: { ...defaultBackground },
        history: [],
        historyIndex: -1,
        activeRegionId: null,
        phoneTemplate: null,
      });
    },

    setPrintFile: (url) => set({ printFile: url }),
    setPrintGenerating: (generating) => set({ printGenerating: generating }),

    generatePrintFile: async () => {
      const state = get();
      const captureFn = state.captureRef;
      if (!captureFn) return null;
      state.setPrintGenerating(true);
      try {
        const dataUrl = await captureFn();
        if (dataUrl) {
          state.setPrintFile(dataUrl);
          return dataUrl;
        }
        return null;
      } finally {
        state.setPrintGenerating(false);
      }
    },

    toDesignDocument: () => {
      const state = get();
      return {
        id: generateId(),
        templateId: state.phoneTemplate?.templateId || '',
        templateVersion: '1.0',
        layers: state.layers.map((l) => ({
          type: l.type,
          data: { ...l },
          transform: matrixFromTransform(
            (l as any).x || 0,
            (l as any).y || 0,
            (l as any).width || 100,
            (l as any).height || 100,
            (l as any).rotation || 0,
            (l as any).flipX ? -1 : 1,
            (l as any).flipY ? -1 : 1
          ),
          zIndex: state.layers.indexOf(l),
          visible: l.visible,
          locked: l.locked,
          blendMode: (l as any).blendMode || 'normal',
          opacity: (l as any).opacity || 1,
        })),
        background: state.background,
        settings: {
          materialId: state.materialId || '',
          brand: state.brand || '',
          modelId: state.modelId || '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
  }))
);

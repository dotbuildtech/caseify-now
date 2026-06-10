'use client';
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { fetchBrands, fetchModelsByBrand, fetchMaterials, calculatePrice } from '@/services/studioApi';

const StudioContext = createContext(null);

let layerIdCounter = 0;
const nextId = () => `layer_${Date.now()}_${++layerIdCounter}`;

const initialFormState = {
    text: 'Your Story',
    font: 'sans',
    color: '#0A0A0A',
    bgColor: '#F4F4F5',
    bgImage: null,
    size: 48,
    bold: false,
    align: 'center',
    letterSpacing: 0,
    uppercase: true,
    imageUrl: null,
    aiPrompt: '',
    layers: []
};

const SAVED_KEY = 'dotbuild_saved_designs';

const loadSaved = () => {
    if (typeof window === 'undefined') return [];
    try { const raw = localStorage.getItem(SAVED_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
};

const persistSaved = (list) => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch {}
};

export function StudioProvider({ children }) {
    const [brand, setBrand] = useState('Apple');
    const [modelId, setModelId] = useState('iphone-16-pro');
    const [materialId, setMaterialId] = useState('matte-hard');
    const [form, setForm] = useState(initialFormState);
    const [layers, setLayers] = useState([]);
    const [selectedLayerId, setSelectedLayerId] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [savedDesigns, setSavedDesigns] = useState([]);

    const [brands, setBrands] = useState(['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Nothing']);
    const [models, setModels] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [brandsLoading, setBrandsLoading] = useState(false);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [materialsLoading, setMaterialsLoading] = useState(false);
    const [totalPrice, setTotalPrice] = useState(399);

    useEffect(() => { setSavedDesigns(loadSaved()); }, []);

    useEffect(() => {
        let mounted = true;
        setBrandsLoading(true);
        fetchBrands().then((data) => { if (mounted) { setBrands(data); setBrandsLoading(false); } }).catch(() => { if (mounted) setBrandsLoading(false); });
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (!brand) return;
        let mounted = true;
        setModelsLoading(true);
        fetchModelsByBrand(brand).then((data) => {
            if (!mounted) return;
            setModels(data);
            setModelsLoading(false);
            if (data.length > 0 && !data.find((m) => m.id === modelId)) {
                setModelId(data[0].id);
            }
        }).catch(() => { if (mounted) setModelsLoading(false); });
        return () => { mounted = false; };
    }, [brand]);

    useEffect(() => {
        if (!modelId) return;
        let mounted = true;
        setMaterialsLoading(true);
        fetchMaterials(modelId).then((data) => {
            if (!mounted) return;
            setMaterials(data);
            setMaterialsLoading(false);
            if (data.length > 0 && !data.find((m) => m.id === materialId)) {
                setMaterialId(data[0].id);
            }
        }).catch(() => { if (mounted) setMaterialsLoading(false); });
        return () => { mounted = false; };
    }, [modelId]);

    useEffect(() => {
        let mounted = true;
        const hasImage = layers.some((l) => l.type === 'image');
        const hasText = layers.some((l) => l.type === 'text');
        calculatePrice({ modelId, materialId, layerCount: layers.length, hasText, hasImage }).then((price) => {
            if (mounted) setTotalPrice(price);
        }).catch(() => {});
        return () => { mounted = false; };
    }, [modelId, materialId, layers]);

    const model = useMemo(() => models.find((m) => m.id === modelId) || null, [models, modelId]);
    const material = useMemo(() => materials.find((m) => m.id === materialId) || null, [materials, materialId]);

    const updateForm = useCallback((patch) => { setForm((f) => ({ ...f, ...patch })); }, []);

    const addTextLayer = useCallback((text) => {
        const id = nextId();
        setLayers((l) => [...l, { id, type: 'text', text: text || 'Your Text', x: 50, y: 50, size: 32, color: '#0A0A0A', font: 'sans', rotation: 0, scale: 1, opacity: 1 }]);
        setSelectedLayerId(id);
        return id;
    }, []);

    const addStickerLayer = useCallback((sticker) => {
        const id = nextId();
        setLayers((l) => [...l, { id, type: 'sticker', stickerId: sticker.id, emoji: sticker.emoji, x: 50, y: 50, size: 60, rotation: 0, scale: 1, opacity: 1 }]);
        setSelectedLayerId(id);
        return id;
    }, []);

    const addImageLayer = useCallback((url) => {
        const id = nextId();
        setLayers((l) => [...l, { id, type: 'image', url, x: 50, y: 50, width: 60, rotation: 0, scale: 1, opacity: 1, filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0 } }]);
        setSelectedLayerId(id);
        return id;
    }, []);

    const updateLayer = useCallback((id, patch) => {
        setLayers((l) => l.map((lyr) => lyr.id === id ? { ...lyr, ...patch } : lyr));
    }, []);

    const removeLayer = useCallback((id) => {
        setLayers((l) => l.filter((lyr) => lyr.id !== id));
        setSelectedLayerId((s) => s === id ? null : s);
    }, []);

    const duplicateLayer = useCallback((id) => {
        setLayers((l) => {
            const found = l.find((lyr) => lyr.id === id);
            if (!found) return l;
            const newId = nextId();
            return [...l, { ...found, id: newId, x: Math.min(95, (found.x || 50) + 5), y: Math.min(95, (found.y || 50) + 5) }];
        });
    }, []);

    const moveLayer = useCallback((id, dir) => {
        setLayers((l) => {
            const idx = l.findIndex((lyr) => lyr.id === id);
            if (idx < 0) return l;
            const newIdx = dir === 'up' ? idx + 1 : idx - 1;
            if (newIdx < 0 || newIdx >= l.length) return l;
            const copy = [...l];
            const [item] = copy.splice(idx, 1);
            copy.splice(newIdx, 0, item);
            return copy;
        });
    }, []);

    const clearAll = useCallback(() => {
        setLayers([]);
        setSelectedLayerId(null);
        setForm((f) => ({ ...f, bgImage: null, imageUrl: null, aiPrompt: '' }));
    }, []);

    const applyTemplate = useCallback((template) => {
        setLayers(template.layers?.map((l) => ({ ...l, id: nextId() })) || []);
        if (template.bgColor) updateForm({ bgColor: template.bgColor, bgImage: null });
        if (template.bgImage) updateForm({ bgColor: null, bgImage: template.bgImage });
        setSelectedLayerId(null);
    }, [updateForm]);

    const saveDesign = useCallback((thumbnail) => {
        const design = {
            id: `design_${Date.now()}`,
            createdAt: new Date().toISOString(),
            brand, modelId, materialId,
            form: { ...form, layers },
            thumbnail: thumbnail || null
        };
        setSavedDesigns((prev) => {
            const next = [design, ...prev].slice(0, 50);
            persistSaved(next);
            return next;
        });
        return design;
    }, [brand, modelId, materialId, form, layers]);

    const loadDesign = useCallback((design) => {
        if (design.brand) setBrand(design.brand);
        if (design.modelId) setModelId(design.modelId);
        if (design.materialId) setMaterialId(design.materialId);
        setLayers(design.form.layers || []);
        setForm({ ...initialFormState, ...design.form });
        setSelectedLayerId(null);
    }, []);

    const deleteDesign = useCallback((id) => {
        const next = savedDesigns.filter((d) => d.id !== id);
        setSavedDesigns(next);
        persistSaved(next);
    }, [savedDesigns]);

    const selectedLayer = useMemo(() => layers.find((l) => l.id === selectedLayerId) || null, [layers, selectedLayerId]);

    const value = useMemo(() => ({
        brand, setBrand, modelId, setModelId, model,
        materialId, setMaterialId, material,
        brands, models, materials,
        brandsLoading, modelsLoading, materialsLoading,
        form, updateForm, totalPrice,
        layers, setLayers, addTextLayer, addStickerLayer, addImageLayer,
        updateLayer, removeLayer, duplicateLayer, moveLayer, clearAll,
        selectedLayerId, setSelectedLayerId, selectedLayer,
        previewImage, setPreviewImage,
        savedDesigns, saveDesign, loadDesign, deleteDesign,
        applyTemplate
    }), [
        brand, modelId, model, materialId, material,
        brands, models, materials,
        brandsLoading, modelsLoading, materialsLoading,
        form, totalPrice, layers, selectedLayerId, selectedLayer,
        previewImage, savedDesigns,
        updateForm, addTextLayer, addStickerLayer, addImageLayer,
        updateLayer, removeLayer, duplicateLayer, moveLayer, clearAll,
        saveDesign, loadDesign, deleteDesign, applyTemplate
    ]);

    return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export const useStudio = () => {
    const ctx = useContext(StudioContext);
    if (!ctx) throw new Error('useStudio must be used within StudioProvider');
    return ctx;
};

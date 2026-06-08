'use client';
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { getMaterialById, getPhoneById, BASE_PRICE } from '@/utils/studio';

const StudioContext = createContext(null);

let layerIdCounter = 0;
const nextId = () => `layer_${Date.now()}_${++layerIdCounter}`;

const initialFormState = {
    text: 'Your Story',
    font: 'serif',
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
    try {
        const raw = localStorage.getItem(SAVED_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
};

const persistSaved = (list) => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch {}
};

export function StudioProvider({ children }) {
    const [phoneId, setPhoneId] = useState(PHONE_MODELS_INIT.phoneId);
    const [materialId, setMaterialId] = useState(MATERIALS_INIT.materialId);
    const [form, setForm] = useState(initialFormState);
    const [layers, setLayers] = useState([]);
    const [selectedLayerId, setSelectedLayerId] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [savedDesigns, setSavedDesigns] = useState([]);

    useEffect(() => {
        setSavedDesigns(loadSaved());
    }, []);

    const phone = useMemo(() => getPhoneById(phoneId), [phoneId]);
    const material = useMemo(() => getMaterialById(materialId), [materialId]);
    const totalPrice = useMemo(() => material.price, [material]);

    const updateForm = useCallback((patch) => {
        setForm((f) => ({ ...f, ...patch }));
    }, []);

    const addTextLayer = useCallback((text) => {
        const id = nextId();
        setLayers((l) => [...l, { id, type: 'text', text: text || 'Your Text', x: 50, y: 50, size: 32, color: '#0A0A0A', font: 'serif', rotation: 0, scale: 1, opacity: 1 }]);
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
        setLayers((l) => [...l, { id, type: 'image', url, x: 50, y: 50, width: 60, rotation: 0, scale: 1, opacity: 1 }]);
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

    const saveDesign = useCallback((thumbnail) => {
        const design = {
            id: `design_${Date.now()}`,
            createdAt: new Date().toISOString(),
            phoneId,
            materialId,
            form: { ...form, layers },
            thumbnail: thumbnail || null
        };
        const next = [design, ...savedDesigns].slice(0, 50);
        setSavedDesigns(next);
        persistSaved(next);
        return design;
    }, [phoneId, materialId, form, layers, savedDesigns]);

    const loadDesign = useCallback((design) => {
        setPhoneId(design.phoneId);
        setMaterialId(design.materialId);
        setLayers(design.form.layers || []);
        setForm({ ...initialFormState, ...design.form });
        setSelectedLayerId(null);
    }, []);

    const deleteDesign = useCallback((id) => {
        const next = savedDesigns.filter((d) => d.id !== id);
        setSavedDesigns(next);
        persistSaved(next);
    }, [savedDesigns]);

    const value = useMemo(() => ({
        phoneId, setPhoneId, phone,
        materialId, setMaterialId, material,
        form, updateForm,
        layers, setLayers, addTextLayer, addStickerLayer, addImageLayer,
        updateLayer, removeLayer, duplicateLayer, moveLayer, clearAll,
        selectedLayerId, setSelectedLayerId,
        previewImage, setPreviewImage,
        savedDesigns, saveDesign, loadDesign, deleteDesign,
        totalPrice
    }), [phoneId, phone, materialId, material, form, layers, selectedLayerId, previewImage, savedDesigns, totalPrice, updateForm, addTextLayer, addStickerLayer, addImageLayer, updateLayer, removeLayer, duplicateLayer, moveLayer, clearAll, saveDesign, loadDesign, deleteDesign]);

    return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

const PHONE_MODELS_INIT = { phoneId: 'iphone-16-pro' };
const MATERIALS_INIT = { materialId: 'impact-matte' };

export const useStudio = () => {
    const ctx = useContext(StudioContext);
    if (!ctx) throw new Error('useStudio must be used within StudioProvider');
    return ctx;
};

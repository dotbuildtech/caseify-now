import api from './api';

export const fetchBrands = async () => {
    try {
        const { data } = await api.get('/studio/brands');
        return data.data || data;
    } catch {
        return ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Nothing', 'Motorola'];
    }
};

export const fetchModelsByBrand = async (brand) => {
    if (!brand) return [];
    try {
        const { data } = await api.get(`/studio/models?brand=${encodeURIComponent(brand)}`);
        return data.data || data;
    } catch {
        return [];
    }
};

export const searchModels = async (query) => {
    if (!query || query.length < 2) return [];
    try {
        const { data } = await api.get(`/studio/models/search?q=${encodeURIComponent(query)}`);
        return data.data || data;
    } catch {
        return [];
    }
};

export const fetchMaterials = async (modelId) => {
    try {
        const { data } = await api.get(`/studio/materials?modelId=${encodeURIComponent(modelId || '')}`);
        return data.data || data || [];
    } catch {
        return [];
    }
};

export const calculatePrice = async ({ materialId, layerCount }) => {
    try {
        const { data } = await api.post('/studio/calculate-price', { materialId, layerCount });
        return data?.price ?? data?.total ?? 399;
    } catch {
        return 399;
    }
};

export const fetchTemplates = async () => {
    try {
        const { data } = await api.get('/studio/templates');
        return data.data || data;
    } catch {
        return [
            { id: 'tpl-minimal', label: 'Minimal', thumb: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=200&h=300&fit=crop&q=60', layers: [{ type: 'text', text: 'YOUR NAME', x: 50, y: 70, size: 24, color: '#FFFFFF', font: 'sans', rotation: 0, scale: 1, opacity: 1 }], bgColor: '#0A0A0A' },
            { id: 'tpl-floral', label: 'Floral', thumb: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=200&h=300&fit=crop&q=60', layers: [], bgImage: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=70' },
            { id: 'tpl-bold', label: 'Bold', thumb: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=200&h=300&fit=crop&q=60', layers: [{ type: 'text', text: 'LEGEND', x: 50, y: 50, size: 48, color: '#DC2626', font: 'sans', rotation: 0, scale: 1, opacity: 1, bold: true, uppercase: true }], bgColor: '#FFFFFF' },
            { id: 'tpl-gradient', label: 'Sunset', thumb: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=200&h=300&fit=crop&q=60', layers: [], bgImage: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=600&q=70' },
            { id: 'tpl-mountain', label: 'Mountain', thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=300&fit=crop&q=60', layers: [], bgImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=70' },
            { id: 'tpl-clean', label: 'Clean', thumb: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=200&h=300&fit=crop&q=60', layers: [], bgColor: '#F4F4F5' }
        ];
    }
};



export const uploadStudioImage = async (dataUrl) => {
    try {
        const { data } = await api.post('/uploads/studio-image', { dataUrl });
        return data?.url || null;
    } catch {
        return null;
    }
};

export const uploadStudioImageBlob = async (blob, mimeType = 'image/jpeg') => {
    try {
        const formData = new FormData();
        const file = new File([blob], `upload.${mimeType === 'image/png' ? 'png' : 'jpg'}`, { type: mimeType });
        formData.append('image', file);
        const { data } = await api.post('/uploads/studio-image-blob', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000
        });
        return data?.url || null;
    } catch {
        return null;
    }
};

export const fetchTemplateByModelId = async (modelId) => {
    if (!modelId) return null;
    try {
        const { data } = await api.get(`/studio/templates?modelId=${encodeURIComponent(modelId)}`);
        return data?.data || null;
    } catch { return null; }
};

export const fetchMaterialDesigns = async (materialId) => {
    if (!materialId) return [];
    try {
        const { data } = await api.get(`/studio/materials/${encodeURIComponent(materialId)}/designs`);
        return (data.data || data).filter((d) => d.isActive !== false);
    } catch {
        return [];
    }
};

export const fetchDesignsByModelSlug = async (modelSlug) => {
    if (!modelSlug) return [];
    try {
        const { data } = await api.get(`/studio/designs?modelSlug=${encodeURIComponent(modelSlug)}`);
        return data.data || [];
    } catch { return []; }
};

export const fetchStudioProductsByModel = async (studioModelId) => {
    if (!studioModelId) return [];
    try {
        const { data } = await api.get(`/studio/products?studioModelId=${encodeURIComponent(studioModelId)}`);
        return data.data || [];
    } catch { return []; }
};

const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');

const { BRANDS, PHONE_MODELS, MATERIALS, MATERIAL_DESIGNS } = require('../../seed-studio');

router.get('/brands', (req, res) => {
    res.json({ success: true, data: BRANDS });
});

router.get('/models', (req, res) => {
    const { brand } = req.query;
    const models = brand ? (PHONE_MODELS[brand] || []) : Object.values(PHONE_MODELS).flat();
    res.json({ success: true, data: models });
});

router.get('/models/search', (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: [] });
    const query = q.toLowerCase();
    const results = [];
    Object.entries(PHONE_MODELS).forEach(([brand, models]) => {
        models.forEach((m) => {
            if (m.label.toLowerCase().includes(query) || brand.toLowerCase().includes(query)) {
                results.push({ ...m, brand });
            }
        });
    });
    res.json({ success: true, data: results.slice(0, 15) });
});

router.get('/materials', (req, res) => {
    const { modelId } = req.query;
    const materials = MATERIALS.filter((m) => m.stock > 0);
    res.json({ success: true, data: materials });
});

router.get('/materials/:materialId/designs', (req, res) => {
    const { materialId } = req.params;
    const designs = (MATERIAL_DESIGNS[materialId] || []).filter((d) => d.isActive);
    res.json({ success: true, data: designs });
});

router.post('/calculate-price', (req, res) => {
    const { materialId, layerCount, hasText, hasImage } = req.body;
    const material = MATERIALS.find((m) => m.id === materialId);
    const base = material ? material.price : 399;
    const layerFee = layerCount > 2 ? (layerCount - 2) * 25 : 0;
    res.json({ success: true, price: base + layerFee, base, layerFee, total: base + layerFee });
});

router.get('/templates', (req, res) => {
    const templates = [
        { id: 'tpl-minimal', label: 'Minimal', thumb: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=200&h=300&fit=crop&q=60', layers: [{ type: 'text', text: 'YOUR NAME', x: 50, y: 70, size: 24, color: '#FFFFFF', font: 'sans', rotation: 0, scale: 1, opacity: 1 }], bgColor: '#0A0A0A' },
        { id: 'tpl-floral', label: 'Floral', thumb: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=200&h=300&fit=crop&q=60', layers: [], bgImage: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=70' },
        { id: 'tpl-bold', label: 'Bold', thumb: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=200&h=300&fit=crop&q=60', layers: [{ type: 'text', text: 'LEGEND', x: 50, y: 50, size: 48, color: '#DC2626', font: 'sans', rotation: 0, scale: 1, opacity: 1, bold: true, uppercase: true }], bgColor: '#FFFFFF' },
        { id: 'tpl-gradient', label: 'Sunset', thumb: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=200&h=300&fit=crop&q=60', layers: [], bgImage: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=600&q=70' },
        { id: 'tpl-mountain', label: 'Mountain', thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=300&fit=crop&q=60', layers: [], bgImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=70' },
        { id: 'tpl-clean', label: 'Clean', thumb: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=200&h=300&fit=crop&q=60', layers: [], bgColor: '#F4F4F5' }
    ];
    res.json({ success: true, data: templates });
});

module.exports = router;

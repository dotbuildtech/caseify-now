const { Op } = require('sequelize');
const Material = require('../models/Material');

const DEFAULT_BASE_PRICE = 399;
const MAX_DESIGN_LAYERS = 20;

// Server-side authoritative price for a custom studio design.
// Single source of truth used by POST /api/studio/calculate-price and order
// pricing. Client-supplied prices (designMeta.materialPrice / totalPrice) are
// NEVER trusted; the price is derived from the Materials table.
const computeStudioPrice = async ({ materialId, layerCount } = {}) => {
    let base = DEFAULT_BASE_PRICE;
    if (materialId !== undefined && materialId !== null && materialId !== '') {
        const byId = !isNaN(materialId) ? { id: parseInt(materialId, 10) } : null;
        const material = await Material.findOne({
            where: { [Op.or]: [{ slug: String(materialId) }, byId].filter(Boolean) }
        });
        if (material && material.isActive !== false) {
            base = Number(material.price);
        }
    }
    const count = Math.min(MAX_DESIGN_LAYERS, Math.max(0, parseInt(layerCount, 10) || 0));
    const layerFee = count > 2 ? (count - 2) * 25 : 0;
    return { base, layerFee, layerCount: count, perUnitPrice: base + layerFee };
};

module.exports = { computeStudioPrice, DEFAULT_BASE_PRICE, MAX_DESIGN_LAYERS };

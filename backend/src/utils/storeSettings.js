const StoreSetting = require('../models/StoreSetting');

let settingsCache = null;
let lastFetch = 0;
const CACHE_TTL_MS = 30000; // 30 seconds in-memory cache

const getStoreSettings = async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && settingsCache && (now - lastFetch < CACHE_TTL_MS)) {
        return settingsCache;
    }

    try {
        const rows = await StoreSetting.findAll();
        const settingsMap = {};
        for (const row of rows) {
            settingsMap[row.key] = row.value;
        }

        const shippingFee = parseFloat(settingsMap.shippingFee || process.env.SHIPPING_FEE || '49');
        const freeShippingThreshold = parseFloat(settingsMap.freeShippingThreshold || process.env.FREE_SHIPPING_THRESHOLD || '500');
        const defaultGstRate = parseFloat(settingsMap.defaultGstRate || process.env.TAX_RATE ? String(parseFloat(process.env.TAX_RATE) * 100) : '18');

        settingsCache = {
            shippingFee: Number.isFinite(shippingFee) ? shippingFee : 49,
            freeShippingThreshold: Number.isFinite(freeShippingThreshold) ? freeShippingThreshold : 500,
            defaultGstRate: Number.isFinite(defaultGstRate) ? defaultGstRate : 18
        };
        lastFetch = now;
        return settingsCache;
    } catch (err) {
        console.warn('[storeSettings] Failed to fetch settings from DB, using defaults:', err.message);
        return {
            shippingFee: parseFloat(process.env.SHIPPING_FEE || '49'),
            freeShippingThreshold: parseFloat(process.env.FREE_SHIPPING_THRESHOLD || '500'),
            defaultGstRate: parseFloat(process.env.TAX_RATE ? String(parseFloat(process.env.TAX_RATE) * 100) : '18')
        };
    }
};

const updateStoreSettings = async ({ shippingFee, freeShippingThreshold, defaultGstRate }) => {
    const updates = [];
    if (shippingFee !== undefined && Number.isFinite(Number(shippingFee))) {
        updates.push(StoreSetting.upsert({
            key: 'shippingFee',
            value: String(Math.max(0, Number(shippingFee))),
            description: 'Standard Shipping Fee in INR'
        }));
    }
    if (freeShippingThreshold !== undefined && Number.isFinite(Number(freeShippingThreshold))) {
        updates.push(StoreSetting.upsert({
            key: 'freeShippingThreshold',
            value: String(Math.max(0, Number(freeShippingThreshold))),
            description: 'Order subtotal threshold in INR for free shipping'
        }));
    }
    if (defaultGstRate !== undefined && Number.isFinite(Number(defaultGstRate))) {
        updates.push(StoreSetting.upsert({
            key: 'defaultGstRate',
            value: String(Math.min(100, Math.max(0, Number(defaultGstRate)))),
            description: 'Default GST percentage'
        }));
    }

    await Promise.all(updates);
    settingsCache = null; // Invalidate cache
    return await getStoreSettings(true);
};

module.exports = {
    getStoreSettings,
    updateStoreSettings
};

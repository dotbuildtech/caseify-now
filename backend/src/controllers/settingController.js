const asyncHandler = require('../utils/asyncHandler');
const { getStoreSettings, updateStoreSettings } = require('../utils/storeSettings');

exports.getSettings = asyncHandler(async (req, res) => {
    const settings = await getStoreSettings(true);
    res.json(settings);
});

exports.updateSettings = asyncHandler(async (req, res) => {
    const { shippingFee, freeShippingThreshold, defaultGstRate } = req.body;
    const updated = await updateStoreSettings({
        shippingFee,
        freeShippingThreshold,
        defaultGstRate
    });
    res.json({
        message: 'Settings updated successfully',
        settings: updated
    });
});

exports.getPublicStorePolicy = asyncHandler(async (req, res) => {
    const settings = await getStoreSettings();
    res.json({
        shippingFee: settings.shippingFee,
        freeShippingThreshold: settings.freeShippingThreshold,
        defaultGstRate: settings.defaultGstRate
    });
});

const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const FilterOption = require('../models/FilterOption');
const { invalidateFilterCache } = require('../utils/cacheManager');

const ALLOWED_KEYS = ['protectorType', 'connectorType', 'chargingSpeed', 'cableType', 'cableConnector', 'earphoneType', 'capacity'];

exports.listFilterOptions = asyncHandler(async (req, res) => {
    const where = { isActive: true };
    if (req.query.key) {
        if (!ALLOWED_KEYS.includes(req.query.key)) {
            res.status(400);
            throw new Error(`Invalid filter key. Allowed: ${ALLOWED_KEYS.join(', ')}`);
        }
        where.key = req.query.key;
    }
    const options = await FilterOption.findAll({
        where,
        order: [['key', 'ASC'], ['sortOrder', 'ASC'], ['value', 'ASC']]
    });
    res.json({ data: options });
});

exports.adminListFilterOptions = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.key) where.key = req.query.key;
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';
    const options = await FilterOption.findAll({
        where,
        order: [['key', 'ASC'], ['sortOrder', 'ASC'], ['value', 'ASC']]
    });
    res.json({ data: options });
});

exports.getFilterOption = asyncHandler(async (req, res) => {
    const option = await FilterOption.findByPk(req.params.id);
    if (!option) { res.status(404); throw new Error('Filter option not found'); }
    res.json(option);
});

exports.createFilterOption = asyncHandler(async (req, res) => {
    const { key, value, label, sortOrder } = req.body;
    if (!key || !ALLOWED_KEYS.includes(key)) {
        res.status(400);
        throw new Error(`Invalid filter key. Allowed: ${ALLOWED_KEYS.join(', ')}`);
    }
    if (!value || typeof value !== 'string' || !value.trim()) {
        res.status(400);
        throw new Error('Value is required');
    }
    const existing = await FilterOption.findOne({ where: { key, value: value.trim() } });
    if (existing) {
        res.status(409);
        throw new Error(`Filter option "${value}" already exists for key "${key}"`);
    }
    const option = await FilterOption.create({
        key,
        value: value.trim(),
        label: label || value.trim(),
        sortOrder: sortOrder != null ? sortOrder : 0
    });
    invalidateFilterCache();
    res.status(201).json(option);
});

exports.updateFilterOption = asyncHandler(async (req, res) => {
    const option = await FilterOption.findByPk(req.params.id);
    if (!option) { res.status(404); throw new Error('Filter option not found'); }
    const { key, value, label, sortOrder, isActive } = req.body;
    const updates = {};
    if (key !== undefined) {
        if (!ALLOWED_KEYS.includes(key)) {
            res.status(400);
            throw new Error(`Invalid filter key. Allowed: ${ALLOWED_KEYS.join(', ')}`);
        }
        updates.key = key;
    }
    if (value !== undefined) {
        if (!value.trim()) { res.status(400); throw new Error('Value cannot be empty'); }
        updates.value = value.trim();
    }
    if (label !== undefined) updates.label = label;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    if (isActive !== undefined) updates.isActive = isActive;
    await option.update(updates);
    invalidateFilterCache();
    res.json(option);
});

exports.deleteFilterOption = asyncHandler(async (req, res) => {
    const option = await FilterOption.findByPk(req.params.id);
    if (!option) { res.status(404); throw new Error('Filter option not found'); }
    await option.destroy({ force: req.query.force === 'true' });
    invalidateFilterCache();
    res.json({ message: 'Filter option deleted' });
});

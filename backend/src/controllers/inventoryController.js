const { Op, Sequelize, literal } = require('sequelize');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const { sequelize } = require('../config/db');

// @desc    Get all inventory
// @route   GET /api/inventory
// @access  Private/Admin
exports.getInventory = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
        const offset = (page - 1) * limit;
        const { count, rows } = await Inventory.findAndCountAll({
            include: [{ model: Product, attributes: ['name', 'category', 'stock'] }],
            limit,
            offset
        });
        res.json({ data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update stock level
// @route   PUT /api/inventory/:id
// @access  Private/Admin
exports.updateStock = async (req, res) => {
    const { change, reason } = req.body;
    const parsedChange = parseInt(change, 10);
    if (Number.isNaN(parsedChange)) {
        return res.status(400).json({ message: 'change must be a valid integer' });
    }

    try {
        const inv = await Inventory.findByPk(req.params.id);
        if (!inv) {
            return res.status(404).json({ message: 'Inventory record not found' });
        }

        const result = await sequelize.transaction(async (t) => {
            const lockedInv = await Inventory.findByPk(req.params.id, { transaction: t });

            lockedInv.quantity += parsedChange;
            const history = [...(lockedInv.history || []), { date: new Date(), change: parsedChange, reason }];
            lockedInv.history = history;

            if (parsedChange > 0) lockedInv.lastRestocked = new Date();

            await lockedInv.save({ transaction: t });

            const product = await Product.findByPk(lockedInv.ProductId, { transaction: t });
            if (product) {
                product.stock = lockedInv.quantity;
                await product.save({ transaction: t });
            }

            return lockedInv;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check low stock items
// @route   GET /api/inventory/low-stock
// @access  Private/Admin
exports.getLowStock = async (req, res) => {
    try {
        const lowStockItems = await Inventory.findAll({
            where: {
                quantity: { [Op.lte]: literal('"lowStockThreshold"') }
            },
            include: [{ model: Product, attributes: ['name'] }],
            limit: 100
        });
        res.json(lowStockItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

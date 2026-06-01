const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

// @desc    Get all inventory
// @route   GET /api/inventory
// @access  Private/Admin
exports.getInventory = async (req, res) => {
    try {
        const inventory = await Inventory.findAll({
            include: [{ model: Product, attributes: ['name', 'category', 'stock'] }]
        });
        res.json(inventory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update stock level
// @route   PUT /api/inventory/:id
// @access  Private/Admin
exports.updateStock = async (req, res) => {
    const { change, reason } = req.body;

    try {
        const inv = await Inventory.findByPk(req.params.id);

        if (inv) {
            inv.quantity += parseInt(change);
            const history = [...inv.history, { date: new Date(), change, reason }];
            inv.history = history;
            
            if (change > 0) inv.lastRestocked = new Date();
            
            await inv.save();

            // Also update Product model stock for consistency
            const product = await Product.findByPk(inv.ProductId);
            if (product) {
                product.stock = inv.quantity;
                await product.save();
            }

            res.json(inv);
        } else {
            res.status(404).json({ message: 'Inventory record not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check low stock items
// @route   GET /api/inventory/low-stock
// @access  Private/Admin
exports.getLowStock = async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const lowStockItems = await Inventory.findAll({
            where: {
                quantity: { [Op.lte]: Sequelize.col('lowStockThreshold') }
            },
            include: [{ model: Product, attributes: ['name'] }]
        });
        res.json(lowStockItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

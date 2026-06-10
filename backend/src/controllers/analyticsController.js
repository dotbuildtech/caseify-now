const { Order, OrderItem } = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { sequelize } = require('../config/db');

// @desc    Get sales analytics
// @route   GET /api/analytics/sales
// @access  Private/Admin
exports.getSalesAnalytics = async (req, res) => {
    try {
        const rows = await OrderItem.findAll({
            attributes: [
                'ProductId',
                [sequelize.fn('SUM', sequelize.col('qty')), 'totalSold'],
                [sequelize.fn('SUM', sequelize.literal('qty * price')), 'revenue']
            ],
            group: ['ProductId'],
            order: [[sequelize.col('totalSold'), 'DESC']],
            limit: 10,
            raw: true
        });

        const productIds = rows.map((r) => r.ProductId);
        const products = await Product.findAll({
            where: { id: productIds },
            attributes: ['id', 'name'],
            raw: true
        });
        const nameMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

        const result = rows.map((r) => ({
            ProductId: r.ProductId,
            totalSold: r.totalSold,
            revenue: r.revenue,
            Product: { name: nameMap[r.ProductId] || 'Unknown' }
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get customer behavior analytics (simplified)
// @route   GET /api/analytics/customers
// @access  Private/Admin
exports.getCustomerAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const activeUsers = await User.count({ where: { isVerified: true } });
        
        const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

        res.json({
            totalUsers,
            activeUsers,
            retentionRate: retentionRate.toFixed(2) + '%'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

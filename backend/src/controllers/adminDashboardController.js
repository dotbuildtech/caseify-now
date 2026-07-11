const asyncHandler = require('../utils/asyncHandler');
const { Op, fn, col } = require('sequelize');
const { sequelize } = require('../config/db');
const { Order } = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const Contact = require('../models/Contact');

let cache = { data: null, timestamp: 0 };
const CACHE_TTL = 15 * 60 * 1000;

const ORDER_ATTRS = ['id', 'orderStatus', 'totalPrice', 'createdAt', 'UserId'];
const USER_ATTRS = ['id', 'name'];
const PROD_ATTRS = ['id', 'name', 'category', 'sku', 'stock', 'lowStockThreshold'];

exports.getAdminDashboard = asyncHandler(async (req, res) => {
    const now = Date.now();
    if (cache.data && (now - cache.timestamp) < CACHE_TTL) {
        res.set('X-Cache', 'HIT');
        return res.json(cache.data);
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [overview, recentOrders, lowStock, customerAnalytics] = await Promise.all([
        (async () => {
            const [
                thisMonthRevenue,
                totalOrders,
                pendingOrders,
                totalProducts,
                unreadMessages,
                totalCustomers,
                pendingInvoices
            ] = await Promise.all([
                Order.findOne({
                    where: { isPaid: true, paidAt: { [Op.gte]: monthStart } },
                    attributes: [[fn('COALESCE', fn('SUM', col('totalPrice')), 0), 'total']],
                    raw: true
                }),
                Order.count(),
                Order.count({ where: { orderStatus: { [Op.in]: ['Ordered', 'Processing'] } } }),
                Product.count({ where: { isActive: true } }),
                Contact.count({ where: { isRead: false } }),
                sequelize.query('SELECT COUNT(DISTINCT "UserId") AS c FROM "Orders"', { type: sequelize.QueryTypes.SELECT }),
                Invoice.count({ where: { status: { [Op.in]: ['Generated', 'Sent'] } } })
            ]);

            return {
                totalOrders,
                todayOrders: 0,
                pendingOrders,
                totalCustomers: Number(totalCustomers[0]?.c || 0),
                unreadMessages,
                lowStockProducts: 0,
                totalProducts,
                revenueThisMonth: Number(thisMonthRevenue?.total || 0),
                pendingInvoices
            };
        })(),

        Order.findAll({
            include: [{ model: User, attributes: USER_ATTRS }],
            attributes: ORDER_ATTRS,
            order: [['createdAt', 'DESC']],
            limit: 6,
            raw: true,
            nest: true
        }),

        Product.findAll({
            where: sequelize.where(col('stock'), '<=', col('lowStockThreshold')),
            attributes: PROD_ATTRS,
            order: [['stock', 'ASC']],
            limit: 6,
            raw: true
        }),

        (async () => {
            const [totalUsers, activeUsers] = await Promise.all([
                User.count(),
                User.count({ where: { isVerified: true } })
            ]);
            const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
            return { totalUsers, activeUsers, retentionRate: retentionRate.toFixed(2) + '%' };
        })()
    ]);

    const data = { overview, recentOrders, lowStock, customerAnalytics };
    cache = { data, timestamp: now };
    res.set('X-Cache', 'MISS');
    res.json(data);
});

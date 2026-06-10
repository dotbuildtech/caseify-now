const Invoice = require('../models/Invoice');
const { Order } = require('../models/Order');
const User = require('../models/User');
const { sequelize } = require('../config/db');

// GST Calculation Utility
const calculateGST = (totalAmount, rate = 18) => {
    const gstTotal = (totalAmount * rate) / 100;
    const cgst = gstTotal / 2;
    const sgst = gstTotal / 2;
    return { gstTotal, cgst, sgst, igst: 0 };
};

// @desc    Generate invoice for an order
// @route   POST /api/accounting/invoice/:orderId
// @access  Private/Admin
exports.generateInvoice = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.orderId, {
            include: [{ model: User, attributes: ['id', 'name', 'email'] }]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const gst = calculateGST(order.totalPrice);
        const invoiceNumber = `INV-${Date.now()}-${order.id}`;

        const invoice = await Invoice.create({
            OrderId: order.id,
            invoiceNumber,
            UserId: order.UserId,
            subTotal: order.totalPrice - gst.gstTotal,
            gstTotal: gst.gstTotal,
            grandTotal: order.totalPrice,
            gstDetails: {
                cgst: gst.cgst,
                sgst: gst.sgst,
                igst: gst.igst
            }
        });

        res.status(201).json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get financial analytics
// @route   GET /api/accounting/analytics
// @access  Private/Admin
exports.getFinancialAnalytics = async (req, res) => {
    try {
        const totals = await Order.findOne({
            where: { isPaid: true },
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
                [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('totalPrice')), 0), 'totalRevenue'],
                [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('taxPrice')), 0), 'totalTax']
            ],
            raw: true
        });
        const totalRevenue = Number(totals?.totalRevenue || 0);
        const totalTax = Number(totals?.totalTax || 0);
        const orderCount = Number(totals?.orderCount || 0);

        // Group by month using Sequelize aggregate/fn (simplified for now as SQL varies)
        const monthlyRevenue = await Order.findAll({
            where: { isPaid: true },
            attributes: [
                [sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "paidAt"')), 'month'],
                [sequelize.fn('SUM', sequelize.col('totalPrice')), 'revenue'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: [sequelize.literal('month')]
        });

        res.json({
            totalRevenue,
            totalTax,
            orderCount,
            monthlyRevenue
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

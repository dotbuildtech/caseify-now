const Invoice = require('../models/Invoice');
const { Order, OrderItem } = require('../models/Order');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { generateInvoicePDF } = require('../services/invoiceService');

exports.downloadInvoice = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
        res.status(404);
        throw new Error('Invoice not found');
    }
    const order = await Order.findByPk(invoice.OrderId, {
        include: [
            { model: User, attributes: ['name', 'email', 'phone'] },
            { model: OrderItem, as: 'items' }
        ]
    });
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }
    if (order.UserId !== req.user.id && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized');
    }
    const pdfBuffer = await generateInvoicePDF(order, invoice);
    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
});

exports.getMyInvoices = asyncHandler(async (req, res) => {
    const invoices = await Invoice.findAll({
        where: { UserId: req.user.id },
        order: [['issuedAt', 'DESC']]
    });
    res.json(invoices);
});

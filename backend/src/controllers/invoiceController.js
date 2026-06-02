const Invoice = require('../models/Invoice');
const { Order } = require('../models/Order');
const User = require('../models/User');
const { generateInvoicePDF } = require('../services/invoiceService');

// @desc    Generate and download invoice PDF
// @route   GET /api/invoices/:id/download
// @access  Private
exports.downloadInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const order = await Order.findByPk(invoice.OrderId, {
            include: [
                { model: User, attributes: ['name', 'email'] },
                { model: require('../models/Order').OrderItem }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns the invoice
        if (order.UserId !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const pdfBuffer = await generateInvoicePDF(order, invoice);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`,
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all invoices for a user
// @route   GET /api/invoices/my
// @access  Private
exports.getMyInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.findAll({
            where: { UserId: req.user.id },
            order: [['issuedAt', 'DESC']]
        });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

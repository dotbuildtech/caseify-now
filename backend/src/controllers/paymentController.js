const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const { Order } = require('../models/Order');

// @desc    Create Razorpay order
// @route   POST /api/payments/order
// @access  Private
exports.createRazorpayOrder = async (req, res) => {
    const { amount, currency = 'INR', receipt } = req.body;

    try {
        const options = {
            amount: amount * 100, // amount in the smallest currency unit
            currency,
            receipt
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    try {
        const order = await Order.findByPk(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.UserId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }

        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentResult = {
            id: razorpay_payment_id,
            status: 'Paid',
            update_time: new Date().toISOString(),
            email_address: req.user.email
        };
        await order.save();

        const Invoice = require('../models/Invoice');
        const lastInvoice = await Invoice.findOne({ order: [['invoiceNumber', 'DESC']] });
        const lastNum = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) : 0;
        const newInvoiceNumber = `INV-${(lastNum + 1).toString().padStart(6, '0')}`;

        await Invoice.create({
            invoiceNumber: newInvoiceNumber,
            subTotal: Number(order.itemsPrice || 0),
            gstTotal: order.taxPrice,
            grandTotal: order.totalPrice,
            status: 'Paid',
            OrderId: order.id,
            UserId: order.UserId
        });

        res.json({ success: true, message: 'Payment verified and invoice generated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

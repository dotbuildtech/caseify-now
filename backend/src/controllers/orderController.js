const { Order, OrderItem } = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.addOrderItems = async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400).json({ message: 'No order items' });
        return;
    }

    try {
        const order = await Order.create({
            UserId: req.user.id,
            shippingAddress,
            paymentMethod,
            taxPrice,
            shippingPrice,
            totalPrice
        });

        for (const item of orderItems) {
            await OrderItem.create({
                OrderId: order.id,
                ProductId: item.product,
                name: item.name,
                qty: item.qty,
                image: item.image,
                price: item.price
            });

            // Update inventory
            const product = await Product.findByPk(item.product);
            if (product) {
                product.stock -= item.qty;
                await product.save();
            }
        }

        const createdOrder = await Order.findByPk(order.id, {
            include: [OrderItem]
        });

        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                { model: User, attributes: ['name', 'email'] },
                { model: OrderItem }
            ]
        });

        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
exports.updateOrderToPaid = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (order) {
            order.isPaid = true;
            order.paidAt = new Date();
            order.paymentResult = {
                id: req.body.id,
                status: req.body.status,
                update_time: req.body.update_time,
                email_address: req.body.payer.email_address
            };

            const updatedOrder = await order.save();

            // Create Invoice
            const Invoice = require('../models/Invoice');
            const lastInvoice = await Invoice.findOne({ order: [['invoiceNumber', 'DESC']] });
            const lastNum = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) : 0;
            const newInvoiceNumber = `INV-${(lastNum + 1).toString().padStart(6, '0')}`;

            await Invoice.create({
                invoiceNumber: newInvoiceNumber,
                subTotal: order.totalPrice - order.taxPrice,
                gstTotal: order.taxPrice,
                grandTotal: order.totalPrice,
                status: 'Paid',
                OrderId: order.id,
                UserId: order.UserId
            });

            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({ 
            where: { UserId: req.user.id },
            include: [OrderItem]
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [{ model: User, attributes: ['id', 'name'] }, OrderItem]
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (order) {
            order.orderStatus = req.body.status || order.orderStatus;
            if (req.body.status === 'Delivered') {
                order.isDelivered = true;
                order.deliveredAt = new Date();
            }
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

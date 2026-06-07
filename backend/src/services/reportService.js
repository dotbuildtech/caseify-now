const { Op } = require('sequelize');
const { Order, OrderItem } = require('../models/Order');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const PaymentRecord = require('../models/PaymentRecord');
const Supplier = require('../models/Supplier');

const escapeCsv = (val) => {
    if (val == null) return '';
    let s = String(val);
    if (/^[=+\-@\t\r]/.test(s)) {
        s = "'" + s;
    }
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
};

const toCsv = (headers, rows) => {
    const lines = [headers.join(',')];
    for (const row of rows) {
        lines.push(headers.map((h) => escapeCsv(row[h])).join(','));
    }
    return lines.join('\n');
};

const parseRange = (query) => {
    const end = query.endDate ? new Date(query.endDate) : new Date();
    const start = query.startDate
        ? new Date(query.startDate)
        : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start, end };
};

exports.generateInvoicesCsv = async (query = {}) => {
    const { start, end } = parseRange(query);
    const invoices = await Invoice.findAll({
        where: { issuedAt: { [Op.between]: [start, end] } },
        order: [['issuedAt', 'DESC']]
    });
    const headers = [
        'invoiceNumber', 'issuedAt', 'dueAt', 'paidAt', 'status',
        'subTotal', 'cgstTotal', 'sgstTotal', 'igstTotal', 'gstTotal',
        'discountTotal', 'shippingTotal', 'grandTotal',
        'buyerName', 'buyerEmail', 'OrderId', 'UserId'
    ];
    const rows = invoices.map((i) => ({
        invoiceNumber: i.invoiceNumber,
        issuedAt: i.issuedAt ? new Date(i.issuedAt).toISOString() : '',
        dueAt: i.dueAt ? new Date(i.dueAt).toISOString() : '',
        paidAt: i.paidAt ? new Date(i.paidAt).toISOString() : '',
        status: i.status,
        subTotal: Number(i.subTotal || 0),
        cgstTotal: Number(i.cgstTotal || 0),
        sgstTotal: Number(i.sgstTotal || 0),
        igstTotal: Number(i.igstTotal || 0),
        gstTotal: Number(i.gstTotal || 0),
        discountTotal: Number(i.discountTotal || 0),
        shippingTotal: Number(i.shippingTotal || 0),
        grandTotal: Number(i.grandTotal || 0),
        buyerName: i.buyerDetails?.name || '',
        buyerEmail: i.buyerDetails?.email || '',
        OrderId: i.OrderId,
        UserId: i.UserId
    }));
    return { filename: `invoices-${Date.now()}.csv`, content: toCsv(headers, rows), rowCount: rows.length };
};

exports.generatePaymentsCsv = async (query = {}, userId = null) => {
    const { start, end } = parseRange(query);
    const where = { paidAt: { [Op.between]: [start, end] } };
    if (userId) where.UserId = userId;

    const records = await PaymentRecord.findAll({ where, order: [['paidAt', 'DESC']] });
    const headers = [
        'transactionId', 'gateway', 'gatewayTransactionId', 'bankAccount', 'bankName',
        'amount', 'fee', 'tax', 'netAmount', 'currency',
        'paymentMethod', 'status', 'paidAt', 'refundedAt', 'refundAmount',
        'customerName', 'customerEmail', 'OrderId'
    ];
    const rows = records.map((r) => ({
        transactionId: r.transactionId,
        gateway: r.gateway,
        gatewayTransactionId: r.gatewayTransactionId || '',
        bankAccount: r.bankAccount || '',
        bankName: r.bankName || '',
        amount: Number(r.amount || 0),
        fee: Number(r.fee || 0),
        tax: Number(r.tax || 0),
        netAmount: Number(r.netAmount || 0),
        currency: r.currency,
        paymentMethod: r.paymentMethod || '',
        status: r.status,
        paidAt: r.paidAt ? new Date(r.paidAt).toISOString() : '',
        refundedAt: r.refundedAt ? new Date(r.refundedAt).toISOString() : '',
        refundAmount: r.refundAmount != null ? Number(r.refundAmount) : '',
        customerName: r.customerName || '',
        customerEmail: r.customerEmail || '',
        OrderId: r.OrderId || ''
    }));
    return { filename: `payments-${Date.now()}.csv`, content: toCsv(headers, rows), rowCount: rows.length };
};

exports.generateExpensesCsv = async (query = {}) => {
    const { start, end } = parseRange(query);
    const expenses = await Expense.findAll({
        where: { expenseDate: { [Op.between]: [start, end] } },
        order: [['expenseDate', 'DESC']],
        include: [{ association: 'supplier', attributes: ['name', 'gstin'] }]
    });
    const headers = [
        'id', 'title', 'category', 'amount', 'gstAmount', 'totalAmount',
        'status', 'paymentMethod', 'bankAccount', 'expenseDate', 'paidAt',
        'receiptNumber', 'supplier', 'supplierGstin'
    ];
    const rows = expenses.map((e) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        amount: Number(e.amount || 0),
        gstAmount: Number(e.gstAmount || 0),
        totalAmount: Number(e.totalAmount || 0),
        status: e.status,
        paymentMethod: e.paymentMethod || '',
        bankAccount: e.bankAccount || '',
        expenseDate: e.expenseDate ? new Date(e.expenseDate).toISOString() : '',
        paidAt: e.paidAt ? new Date(e.paidAt).toISOString() : '',
        receiptNumber: e.receiptNumber || '',
        supplier: e.supplier?.name || '',
        supplierGstin: e.supplier?.gstin || ''
    }));
    return { filename: `expenses-${Date.now()}.csv`, content: toCsv(headers, rows), rowCount: rows.length };
};

exports.generateSuppliersCsv = async () => {
    const suppliers = await Supplier.findAll({ order: [['name', 'ASC']] });
    const headers = [
        'id', 'name', 'contactPerson', 'email', 'phone', 'gstin', 'pan',
        'category', 'paymentTerms', 'outstandingBalance', 'isActive'
    ];
    const rows = suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        contactPerson: s.contactPerson || '',
        email: s.email || '',
        phone: s.phone || '',
        gstin: s.gstin || '',
        pan: s.pan || '',
        category: s.category || '',
        paymentTerms: s.paymentTerms || '',
        outstandingBalance: Number(s.outstandingBalance || 0),
        isActive: s.isActive ? 'true' : 'false'
    }));
    return { filename: `suppliers-${Date.now()}.csv`, content: toCsv(headers, rows), rowCount: rows.length };
};

exports.generateSalesCsv = async (query = {}) => {
    const { start, end } = parseRange(query);
    const orders = await Order.findAll({
        where: { isPaid: true, paidAt: { [Op.between]: [start, end] } },
        include: [{ model: OrderItem, as: 'items' }],
        order: [['paidAt', 'DESC']]
    });
    const headers = [
        'orderId', 'paidAt', 'customerName', 'customerEmail',
        'itemCount', 'itemsPrice', 'taxPrice', 'shippingPrice', 'totalPrice',
        'paymentMethod', 'orderStatus'
    ];
    const rows = [];
    for (const o of orders) {
        rows.push({
            orderId: o.id,
            paidAt: o.paidAt ? new Date(o.paidAt).toISOString() : '',
            customerName: o.User?.name || '',
            customerEmail: o.User?.email || '',
            itemCount: (o.items || []).reduce((a, it) => a + it.qty, 0),
            itemsPrice: o.itemsPrice,
            taxPrice: o.taxPrice,
            shippingPrice: o.shippingPrice,
            totalPrice: o.totalPrice,
            paymentMethod: o.paymentMethod,
            orderStatus: o.orderStatus
        });
    }
    return { filename: `sales-${Date.now()}.csv`, content: toCsv(headers, rows), rowCount: rows.length };
};

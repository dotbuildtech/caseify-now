const asyncHandler = require('../utils/asyncHandler');
const { z } = require('zod');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const { audit } = require('../utils/securityLog');
const { Order, OrderItem } = require('../models/Order');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const PaymentRecord = require('../models/PaymentRecord');
const Supplier = require('../models/Supplier');
const User = require('../models/User');
const financialService = require('../services/financialService');
const reportService = require('../services/reportService');
const { generateInvoicePDF } = require('../services/invoiceService');

const dateRangeQuery = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional()
});

const paginationQuery = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0)
});

const suppliersQuery = paginationQuery.extend({
    isActive: z.enum(['true', 'false']).optional(),
    category: z.string().max(80).optional(),
    q: z.string().max(100).optional()
});

const expensesQuery = paginationQuery.extend({
    category: z.string().max(80).optional(),
    status: z.string().max(40).optional(),
    SupplierId: z.coerce.number().int().positive().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
});

const paymentsQuery = paginationQuery.extend({
    gateway: z.string().max(40).optional(),
    status: z.string().max(40).optional(),
    bankAccount: z.string().max(100).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
});

const paginate = (limit, offset, count) => ({
    limit,
    offset,
    count,
    hasMore: offset + limit < count
});

const supplierSchema = z.object({
    name: z.string().min(1).max(200),
    contactPerson: z.string().max(100).optional(),
    email: z.string().email().max(150).optional().or(z.literal('')),
    phone: z.string().max(20).optional(),
    gstin: z.string().max(20).optional(),
    pan: z.string().max(15).optional(),
    address: z.record(z.any()).default({}),
    bankDetails: z.record(z.any()).default({}),
    category: z.string().max(80).optional(),
    paymentTerms: z.string().max(80).optional(),
    outstandingBalance: z.number().nonnegative().default(0),
    isActive: z.boolean().default(true),
    notes: z.string().optional()
});

const expenseSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    category: z.enum([
        'Raw Material', 'Packaging', 'Shipping', 'Marketing',
        'Salaries', 'Rent', 'Utilities', 'Software', 'Taxes', 'Other'
    ]).default('Other'),
    amount: z.number().nonnegative(),
    gstAmount: z.number().nonnegative().default(0),
    paymentMethod: z.string().max(50).optional(),
    bankAccount: z.string().max(100).optional(),
    status: z.enum(['Pending', 'Paid', 'Cancelled']).default('Paid'),
    expenseDate: z.string().optional(),
    paidAt: z.string().optional(),
    receiptNumber: z.string().max(80).optional(),
    receiptUrl: z.string().url().max(500).optional(),
    SupplierId: z.number().int().positive().optional(),
    tags: z.array(z.string()).default([])
});

const paymentRecordSchema = z.object({
    gateway: z.enum(['Razorpay', 'Stripe', 'PayPal', 'Bank Transfer', 'UPI', 'Cash on Delivery', 'Other']).default('Razorpay'),
    gatewayTransactionId: z.string().max(200).optional(),
    gatewayPaymentId: z.string().max(200).optional(),
    bankAccount: z.string().max(100).optional(),
    bankName: z.string().max(100).optional(),
    amount: z.number().positive(),
    currency: z.string().max(10).default('INR'),
    fee: z.number().nonnegative().default(0),
    tax: z.number().nonnegative().default(0),
    paymentMethod: z.string().max(50).optional(),
    status: z.enum(['Initiated', 'Authorized', 'Captured', 'Failed', 'Refunded', 'Disputed']).default('Captured'),
    paidAt: z.string().optional(),
    OrderId: z.number().int().positive().optional(),
    UserId: z.number().int().positive().optional(),
    customerName: z.string().max(150).optional(),
    customerEmail: z.string().email().max(150).optional(),
    notes: z.string().optional()
});

const invoiceGenerateSchema = z.object({
    orderId: z.number().int().positive(),
    cgstRate: z.number().nonnegative().max(50).default(9),
    sgstRate: z.number().nonnegative().max(50).default(9),
    igstRate: z.number().nonnegative().max(50).default(0),
    hsnCode: z.string().max(20).default('3926'),
    placeOfSupply: z.string().max(80).default('Maharashtra'),
    discountTotal: z.number().nonnegative().default(0),
    shippingTotal: z.number().nonnegative().default(0),
    notes: z.string().optional()
});

const generateInvoiceNumber = async (transaction) => {
    const last = await Invoice.findOne({ order: [['invoiceNumber', 'DESC']], transaction, lock: transaction ? true : false });
    let n = 1;
    if (last) {
        const m = String(last.invoiceNumber).match(/(\d+)\s*$/);
        if (m) n = parseInt(m[1], 10) + 1;
    }
    return `INV-${new Date().getFullYear()}-${String(n).padStart(6, '0')}`;
};

// ============ DASHBOARD ============
exports.getDashboard = asyncHandler(async (req, res) => {
    res.json(await financialService.getDashboardSummary());
});

// ============ REVENUE ============
exports.getRevenue = asyncHandler(async (req, res) => {
    res.json(await financialService.getRevenueAnalytics(req.validatedQuery || req.query));
});

// ============ P&L ============
exports.getProfitAndLoss = asyncHandler(async (req, res) => {
    res.json(await financialService.getProfitAndLoss(req.validatedQuery || req.query));
});

// ============ CASH INFLOW ============
exports.getCashInflow = asyncHandler(async (req, res) => {
    res.json(await financialService.getCashInflow(req.validatedQuery || req.query));
});

// ============ BANK COMPARISON ============
exports.getBankComparison = asyncHandler(async (req, res) => {
    res.json(await financialService.getBankComparison(req.validatedQuery || req.query));
});

// ============ SUPPLIERS ============
exports.listSuppliers = asyncHandler(async (req, res) => {
    const q = req.validatedQuery || req.query;
    const where = {};
    if (q.isActive !== undefined) where.isActive = q.isActive === 'true';
    if (q.category) where.category = q.category;
    if (q.q) {
        where[Op.or] = [
            { name: { [Op.iLike]: `%${q.q}%` } },
            { contactPerson: { [Op.iLike]: `%${q.q}%` } },
            { email: { [Op.iLike]: `%${q.q}%` } },
            { gstin: { [Op.iLike]: `%${q.q}%` } }
        ];
    }
    const count = await Supplier.count({ where });
    const suppliers = await Supplier.findAll({
        where,
        order: [['name', 'ASC']],
        limit: q.limit,
        offset: q.offset,
        include: [{ association: 'expenses', attributes: ['id', 'title', 'totalAmount', 'expenseDate'] }]
    });
    res.json({ count, data: suppliers, pagination: paginate(q.limit, q.offset, count) });
});

exports.getSupplier = asyncHandler(async (req, res) => {
    const supplier = await Supplier.findByPk(req.params.id, {
        include: [{ association: 'expenses', order: [['expenseDate', 'DESC']] }]
    });
    if (!supplier) {
        res.status(404);
        throw new Error('Supplier not found');
    }
    const balances = await financialService.getSupplierBalances();
    const enriched = balances.find((b) => b.id === supplier.id);
    res.json({ ...supplier.toJSON(), summary: enriched });
});

exports.createSupplier = asyncHandler(async (req, res) => {
    const data = req.body;
    const supplier = await Supplier.create(data);
    audit(req, 'supplier.create', `Supplier:${supplier.id}`, { name: supplier.name });
    res.status(201).json(supplier);
});

exports.updateSupplier = asyncHandler(async (req, res) => {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
        res.status(404);
        throw new Error('Supplier not found');
    }
    await supplier.update(req.body);
    audit(req, 'supplier.update', `Supplier:${supplier.id}`);
    res.json(supplier);
});

exports.deleteSupplier = asyncHandler(async (req, res) => {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
        res.status(404);
        throw new Error('Supplier not found');
    }
    const force = req.query.force === 'true';
    await supplier.destroy({ force });
    audit(req, 'supplier.delete', `Supplier:${supplier.id}`, { force });
    res.json({ message: force ? 'Supplier permanently deleted' : 'Supplier archived' });
});

exports.getSupplierBalances = asyncHandler(async (req, res) => {
    res.json({ data: await financialService.getSupplierBalances() });
});

// ============ EXPENSES ============
exports.listExpenses = asyncHandler(async (req, res) => {
    const q = req.validatedQuery || req.query;
    const where = {};
    if (q.category) where.category = q.category;
    if (q.status) where.status = q.status;
    if (q.SupplierId) where.SupplierId = q.SupplierId;
    if (q.startDate || q.endDate) {
        where.expenseDate = {};
        if (q.startDate) where.expenseDate[Op.gte] = new Date(q.startDate);
        if (q.endDate) where.expenseDate[Op.lte] = new Date(q.endDate);
    }
    const count = await Expense.count({ where });
    const expenses = await Expense.findAll({
        where,
        order: [['expenseDate', 'DESC']],
        limit: q.limit,
        offset: q.offset,
        include: [{ association: 'supplier', attributes: ['id', 'name', 'gstin'] }]
    });
    const total = expenses.reduce((a, e) => a + Number(e.totalAmount || 0), 0);
    res.json({
        count,
        total: +total.toFixed(2),
        data: expenses,
        pagination: paginate(q.limit, q.offset, count)
    });
});

exports.getExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findByPk(req.params.id, {
        include: [{ association: 'supplier' }]
    });
    if (!expense) {
        res.status(404);
        throw new Error('Expense not found');
    }
    res.json(expense);
});

exports.createExpense = asyncHandler(async (req, res) => {
    const data = req.body;
    const totalAmount = +(Number(data.amount || 0) + Number(data.gstAmount || 0)).toFixed(2);
    if (data.SupplierId && data.status !== 'Cancelled' && data.status !== 'Pending') {
        const supplier = await Supplier.findByPk(data.SupplierId);
        if (supplier) {
            supplier.outstandingBalance = Number(supplier.outstandingBalance || 0) + totalAmount;
            await supplier.save();
        }
    }
    const expense = await Expense.create({ ...data, totalAmount });
    audit(req, 'expense.create', `Expense:${expense.id}`, { title: expense.title, totalAmount });
    res.status(201).json(expense);
});

exports.updateExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
        res.status(404);
        throw new Error('Expense not found');
    }
    const data = { ...req.body };
    if (data.amount != null || data.gstAmount != null) {
        data.totalAmount = +(Number(data.amount ?? expense.amount) + Number(data.gstAmount ?? expense.gstAmount)).toFixed(2);
    }
    await expense.update(data);
    audit(req, 'expense.update', `Expense:${expense.id}`);
    res.json(expense);
});

exports.deleteExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
        res.status(404);
        throw new Error('Expense not found');
    }
    const force = req.query.force === 'true';
    if (expense.SupplierId && !force) {
        await sequelize.transaction(async (t) => {
            const supplier = await Supplier.findByPk(expense.SupplierId, { transaction: t });
            if (supplier) {
                supplier.outstandingBalance = Math.max(0, Number(supplier.outstandingBalance || 0) - Number(expense.totalAmount || 0));
                await supplier.save({ transaction: t });
            }
            await expense.destroy({ force, transaction: t });
        });
        audit(req, 'expense.delete', `Expense:${expense.id}`);
        return res.json({ message: 'Expense archived' });
    }
    await expense.destroy({ force });
    audit(req, 'expense.delete', `Expense:${expense.id}`);
    res.json({ message: force ? 'Expense permanently deleted' : 'Expense archived' });
});

// ============ PAYMENT RECORDS ============
exports.listPaymentRecords = asyncHandler(async (req, res) => {
    const q = req.validatedQuery || req.query;
    const where = {};
    if (req.user.role !== 'admin') where.UserId = req.user.id;
    if (q.gateway) where.gateway = q.gateway;
    if (q.status) where.status = q.status;
    if (q.bankAccount) where.bankAccount = q.bankAccount;
    if (q.startDate || q.endDate) {
        where.paidAt = {};
        if (q.startDate) where.paidAt[Op.gte] = new Date(q.startDate);
        if (q.endDate) where.paidAt[Op.lte] = new Date(q.endDate);
    }
    const count = await PaymentRecord.count({ where });
    const records = await PaymentRecord.findAll({
        where,
        order: [['paidAt', 'DESC']],
        limit: q.limit,
        offset: q.offset
    });
    const total = records.reduce((a, r) => a + Number(r.netAmount || 0), 0);
    res.json({
        count,
        total: +total.toFixed(2),
        data: records,
        pagination: paginate(q.limit, q.offset, count)
    });
});

exports.getPaymentRecord = asyncHandler(async (req, res) => {
    const record = await PaymentRecord.findByPk(req.params.id);
    if (!record) {
        res.status(404);
        throw new Error('Payment record not found');
    }
    if (req.user.role !== 'admin' && record.UserId !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized');
    }
    res.json(record);
});

exports.createPaymentRecord = asyncHandler(async (req, res) => {
    const data = req.body;
    const amount = Number(data.amount || 0);
    const fee = Number(data.fee || 0);
    const tax = Number(data.tax || 0);
    const netAmount = +(amount - fee - tax).toFixed(2);
    const transactionId = `PAY-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const record = await PaymentRecord.create({
        ...data,
        transactionId,
        netAmount
    });
    audit(req, 'payment.create', `PaymentRecord:${record.id}`, { amount, gateway: record.gateway });
    res.status(201).json(record);
});

// ============ INVOICE GENERATION (enhanced) ============
exports.generateInvoice = asyncHandler(async (req, res) => {
    const { orderId, cgstRate = 9, sgstRate = 9, igstRate = 0, hsnCode = '3926', placeOfSupply = 'Maharashtra', discountTotal = 0, shippingTotal = 0, notes } = req.body;
    const order = await Order.findByPk(orderId, {
        include: [
            { model: User, attributes: ['id', 'name', 'email', 'phone'] },
            { model: OrderItem, as: 'items' }
        ]
    });
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }
    const itemsPrice = Number(order.itemsPrice || (order.items || []).reduce((a, i) => a + Number(i.price) * i.qty, 0));
    const subTotal = +(itemsPrice - Number(discountTotal || 0)).toFixed(2);
    const useInterState = placeOfSupply && order.shippingAddress?.state && placeOfSupply.toLowerCase() !== String(order.shippingAddress.state).toLowerCase();
    const cgst = useInterState ? 0 : +(subTotal * cgstRate / 100).toFixed(2);
    const sgst = useInterState ? 0 : +(subTotal * sgstRate / 100).toFixed(2);
    const igst = useInterState ? +(subTotal * igstRate / 100).toFixed(2) : 0;
    const gstTotal = +(cgst + sgst + igst).toFixed(2);
    const grandTotal = +(subTotal + gstTotal + Number(shippingTotal || 0)).toFixed(2);

    const seller = {
        name: process.env.SELLER_NAME || 'DotBuild Ecommerce Pvt Ltd',
        address: {
            street: process.env.SELLER_STREET || '123 Tech Park',
            city: process.env.SELLER_CITY || 'Mumbai',
            state: process.env.SELLER_STATE || 'Maharashtra',
            postalCode: process.env.SELLER_PIN || '400001',
            country: 'India'
        },
        gstin: process.env.SELLER_GSTIN || '27AAAAA0000A1Z5',
        pan: process.env.SELLER_PAN || 'AAAAA0000A',
        phone: process.env.SELLER_PHONE || '+91-22-12345678',
        email: process.env.SELLER_EMAIL || 'billing@dotbuild.example',
        bankDetails: {
            accountName: process.env.SELLER_BANK_NAME || 'DotBuild Ecommerce Pvt Ltd',
            accountNumber: process.env.SELLER_BANK_AC || '0000000000',
            ifsc: process.env.SELLER_BANK_IFSC || 'HDFC0000000',
            bankName: process.env.SELLER_BANK || 'HDFC Bank',
            branch: process.env.SELLER_BANK_BRANCH || 'Mumbai Main'
        }
    };

    const invoice = await Invoice.create({
        invoiceNumber: await generateInvoiceNumber(),
        OrderId: order.id,
        UserId: order.UserId,
        subTotal,
        cgstTotal: cgst,
        sgstTotal: sgst,
        igstTotal: igst,
        gstTotal,
        discountTotal: Number(discountTotal || 0),
        shippingTotal: Number(shippingTotal || 0),
        grandTotal,
        gstDetails: { cgstRate, sgstRate, igstRate, hsnCode, placeOfSupply, isInterState: useInterState },
        sellerDetails: seller,
        buyerDetails: {
            name: order.User?.name,
            email: order.User?.email,
            phone: order.User?.phone,
            address: order.shippingAddress
        },
        status: 'Generated',
        notes
    });

    audit(req, 'invoice.generate', `Invoice:${invoice.id}`, { orderId, total: grandTotal });
    res.status(201).json(invoice);
});

// ============ DOWNLOAD INVOICE PDF (enhanced) ============
exports.downloadInvoicePDF = asyncHandler(async (req, res) => {
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

// ============ GET INVOICE BY ORDER (admin) ============
exports.getInvoiceByOrder = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({ where: { OrderId: req.params.orderId } });
    if (!invoice) {
        res.status(404);
        throw new Error('Invoice not found for this order');
    }
    res.json(invoice);
});

// ============ ADMIN DOWNLOAD INVOICE ============
exports.adminDownloadInvoicePDF = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized');
    }
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
    const pdfBuffer = await generateInvoicePDF(order, invoice);
    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
});

// ============ DOWNLOAD REPORTS ============
const sendCsv = (res, payload) => {
    res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${payload.filename}"`
    });
    res.send(payload.content);
};

exports.downloadInvoicesCsv = asyncHandler(async (req, res) => {
    const payload = await reportService.generateInvoicesCsv(req.query);
    sendCsv(res, payload);
});

exports.downloadExpensesCsv = asyncHandler(async (req, res) => {
    const payload = await reportService.generateExpensesCsv(req.query);
    sendCsv(res, payload);
});

exports.downloadSuppliersCsv = asyncHandler(async (req, res) => {
    const payload = await reportService.generateSuppliersCsv();
    sendCsv(res, payload);
});

exports.downloadSalesCsv = asyncHandler(async (req, res) => {
    const payload = await reportService.generateSalesCsv(req.query);
    sendCsv(res, payload);
});

exports.downloadPaymentsCsv = asyncHandler(async (req, res) => {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const payload = await reportService.generatePaymentsCsv(req.query, userId);
    sendCsv(res, payload);
});

// ============ CUSTOMER INVOICE & PAYMENT HISTORY ============
exports.getMyInvoices = asyncHandler(async (req, res) => {
    const q = req.validatedQuery || req.query;
    const where = { UserId: req.user.id };
    const count = await Invoice.count({ where });
    const invoices = await Invoice.findAll({
        where,
        order: [['issuedAt', 'DESC']],
        limit: q.limit,
        offset: q.offset
    });
    res.json({ count, data: invoices, pagination: paginate(q.limit, q.offset, count) });
});

exports.getMyInvoice = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({
        where: { id: req.params.id, UserId: req.user.id }
    });
    if (!invoice) {
        res.status(404);
        throw new Error('Invoice not found');
    }
    res.json(invoice);
});

exports.getMyPaymentHistory = asyncHandler(async (req, res) => {
    const q = req.validatedQuery || req.query;
    const where = { UserId: req.user.id };
    const count = await PaymentRecord.count({ where });
    const records = await PaymentRecord.findAll({
        where,
        order: [['paidAt', 'DESC']],
        limit: q.limit,
        offset: q.offset
    });
    const total = records.reduce((a, r) => a + Number(r.netAmount || 0), 0);
    res.json({
        count,
        total: +total.toFixed(2),
        data: records,
        pagination: paginate(q.limit, q.offset, count)
    });
});

exports.downloadMyPaymentsCsv = asyncHandler(async (req, res) => {
    const payload = await reportService.generatePaymentsCsv(req.query, req.user.id);
    sendCsv(res, payload);
});

// ============ Schemas for validation ============
exports.financialSchemas = {
    dateRange: dateRangeQuery,
    pagination: paginationQuery,
    suppliersQuery,
    expensesQuery,
    paymentsQuery,
    supplier: supplierSchema,
    expense: expenseSchema,
    payment: paymentRecordSchema,
    invoice: invoiceGenerateSchema
};

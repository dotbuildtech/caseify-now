const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/db');
const { Order, OrderItem } = require('../models/Order');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const PaymentRecord = require('../models/PaymentRecord');
const Supplier = require('../models/Supplier');

const parseDateRange = (query) => {
    const end = query.endDate ? new Date(query.endDate) : new Date();
    const start = query.startDate
        ? new Date(query.startDate)
        : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        const err = new Error('Invalid startDate or endDate');
        err.status = 400;
        throw err;
    }
    if (start > end) {
        const err = new Error('startDate must be before endDate');
        err.status = 400;
        throw err;
    }
    return { start, end };
};

const getOrderRevenue = async (where) => {
    const rows = await Order.findAll({
        where,
        attributes: [
            [fn('DATE', col('paidAt')), 'date'],
            [fn('COUNT', col('Order.id')), 'orderCount'],
            [fn('SUM', col('totalPrice')), 'revenue'],
            [fn('SUM', col('taxPrice')), 'tax'],
            [fn('SUM', col('shippingPrice')), 'shipping']
        ],
        group: [fn('DATE', col('paidAt'))],
        order: [[fn('DATE', col('paidAt')), 'ASC']],
        raw: true
    });

    return rows.map((r) => ({
        date: r.date,
        orderCount: Number(r.orderCount || 0),
        revenue: Number(r.revenue || 0),
        tax: Number(r.tax || 0),
        shipping: Number(r.shipping || 0)
    }));
};

exports.getRevenueAnalytics = async (query = {}) => {
    const { start, end } = parseDateRange(query);
    const baseWhere = { isPaid: true, paidAt: { [Op.between]: [start, end] } };

    const orders = await Order.findAll({ where: baseWhere });
    const totalRevenue = orders.reduce((a, o) => a + Number(o.totalPrice || 0), 0);
    const totalTax = orders.reduce((a, o) => a + Number(o.taxPrice || 0), 0);
    const totalShipping = orders.reduce((a, o) => a + Number(o.shippingPrice || 0), 0);
    const orderCount = orders.length;
    const avgOrderValue = orderCount > 0 ? +(totalRevenue / orderCount).toFixed(2) : 0;

    const daily = await getOrderRevenue(baseWhere);

    const byCategory = await OrderItem.findAll({
        attributes: [
            [col('Product.category'), 'category'],
            [fn('SUM', col('OrderItem.qty')), 'units'],
            [fn('SUM', literal('"OrderItem"."qty" * "OrderItem"."price"')), 'revenue']
        ],
        include: [
            { model: Order, attributes: [], where: baseWhere },
            { association: 'Product', attributes: [] }
        ],
        group: [col('Product.category')],
        raw: true
    }).catch(() => []);

    return {
        period: { startDate: start.toISOString(), endDate: end.toISOString() },
        summary: {
            totalRevenue: +totalRevenue.toFixed(2),
            totalTax: +totalTax.toFixed(2),
            totalShipping: +totalShipping.toFixed(2),
            orderCount,
            avgOrderValue
        },
        daily,
        byCategory: byCategory.map((r) => ({
            category: r.category,
            units: Number(r.units || 0),
            revenue: Number(r.revenue || 0)
        }))
    };
};

exports.getProfitAndLoss = async (query = {}) => {
    const { start, end } = parseDateRange(query);
    const orderWhere = { isPaid: true, paidAt: { [Op.between]: [start, end] } };
    const expenseWhere = { expenseDate: { [Op.between]: [start, end] } };

    const orders = await Order.findAll({ where: orderWhere });
    const grossRevenue = orders.reduce((a, o) => a + Number(o.totalPrice || 0), 0);
    const cogs = orders.reduce((a, o) => a + Number(o.shippingPrice || 0), 0);
    const grossProfit = grossRevenue - cogs;

    const expenses = await Expense.findAll({ where: expenseWhere });
    const expenseByCategory = expenses.reduce((acc, e) => {
        const cat = e.category || 'Other';
        if (!acc[cat]) acc[cat] = 0;
        acc[cat] += Number(e.totalAmount || 0);
        return acc;
    }, {});
    const totalExpenses = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);

    const taxCollected = orders.reduce((a, o) => a + Number(o.taxPrice || 0), 0);

    const netProfit = grossProfit - totalExpenses;
    const profitMargin = grossRevenue > 0 ? +((netProfit / grossRevenue) * 100).toFixed(2) : 0;

    return {
        period: { startDate: start.toISOString(), endDate: end.toISOString() },
        revenue: {
            grossRevenue: +grossRevenue.toFixed(2),
            orderCount: orders.length
        },
        cogs: {
            shipping: +cogs.toFixed(2),
            total: +cogs.toFixed(2)
        },
        grossProfit: +grossProfit.toFixed(2),
        expenses: {
            byCategory: Object.fromEntries(
                Object.entries(expenseByCategory).map(([k, v]) => [k, +v.toFixed(2)])
            ),
            total: +totalExpenses.toFixed(2)
        },
        taxCollected: +taxCollected.toFixed(2),
        netProfit: +netProfit.toFixed(2),
        profitMarginPercent: profitMargin,
        profitable: netProfit > 0
    };
};

exports.getCashInflow = async (query = {}) => {
    const { start, end } = parseDateRange(query);
    const where = {
        status: { [Op.in]: ['Captured', 'Authorized'] },
        paidAt: { [Op.between]: [start, end] }
    };

    const records = await PaymentRecord.findAll({ where, order: [['paidAt', 'ASC']] });

    const totalInflow = records.reduce((a, r) => a + Number(r.netAmount || 0), 0);
    const grossInflow = records.reduce((a, r) => a + Number(r.amount || 0), 0);
    const totalFees = records.reduce((a, r) => a + Number(r.fee || 0), 0);

    const daily = records.reduce((acc, r) => {
        const d = new Date(r.paidAt).toISOString().slice(0, 10);
        if (!acc[d]) acc[d] = { date: d, gross: 0, net: 0, count: 0 };
        acc[d].gross += Number(r.amount || 0);
        acc[d].net += Number(r.netAmount || 0);
        acc[d].count += 1;
        return acc;
    }, {});
    const dailyArr = Object.values(daily)
        .map((d) => ({
            date: d.date,
            grossInflow: +d.gross.toFixed(2),
            netInflow: +d.net.toFixed(2),
            transactionCount: d.count
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        period: { startDate: start.toISOString(), endDate: end.toISOString() },
        totalInflow: +totalInflow.toFixed(2),
        grossInflow: +grossInflow.toFixed(2),
        totalFees: +totalFees.toFixed(2),
        transactionCount: records.length,
        daily: dailyArr
    };
};

exports.getBankComparison = async (query = {}) => {
    const { start, end } = parseDateRange(query);

    const inflowWhere = {
        status: { [Op.in]: ['Captured', 'Authorized'] },
        paidAt: { [Op.between]: [start, end] }
    };
    const expenseWhere = { expenseDate: { [Op.between]: [start, end] } };

    const inflow = await PaymentRecord.findAll({ where: inflowWhere });
    const expenses = await Expense.findAll({ where: expenseWhere });

    const bucket = (records, key) => records.reduce((acc, r) => {
        const k = (key(r) || 'Unspecified').trim() || 'Unspecified';
        if (!acc[k]) acc[k] = { key: k, inflow: 0, inflowCount: 0, outflow: 0, outflowCount: 0 };
        acc[k].inflow += Number(r.netAmount || r.amount || 0);
        acc[k].inflowCount += 1;
        return acc;
    }, {});

    const inflowBuckets = bucket(inflow, (r) => r.bankAccount || r.gateway || 'Other');

    expenses.forEach((e) => {
        const k = (e.bankAccount || e.paymentMethod || 'Cash').trim() || 'Cash';
        if (!inflowBuckets[k]) inflowBuckets[k] = { key: k, inflow: 0, inflowCount: 0, outflow: 0, outflowCount: 0 };
        inflowBuckets[k].outflow += Number(e.totalAmount || 0);
        inflowBuckets[k].outflowCount += 1;
    });

    const list = Object.values(inflowBuckets).map((b) => ({
        bank: b.key,
        inflow: +b.inflow.toFixed(2),
        inflowCount: b.inflowCount,
        outflow: +b.outflow.toFixed(2),
        outflowCount: b.outflowCount,
        net: +(b.inflow - b.outflow).toFixed(2)
    })).sort((a, b) => (b.inflow + b.outflow) - (a.inflow + a.outflow));

    return {
        period: { startDate: start.toISOString(), endDate: end.toISOString() },
        accounts: list
    };
};

exports.getSupplierBalances = async () => {
    const suppliers = await Supplier.findAll({ where: { isActive: true } });
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const expenseAgg = await Expense.findAll({
        where: { expenseDate: { [Op.gte]: since }, SupplierId: { [Op.ne]: null } },
        attributes: [
            'SupplierId',
            [fn('SUM', col('totalAmount')), 'totalSpent'],
            [fn('COUNT', col('id')), 'invoiceCount']
        ],
        group: ['SupplierId'],
        raw: true
    });

    const map = new Map(expenseAgg.map((r) => [r.SupplierId, r]));
    return suppliers.map((s) => {
        const agg = map.get(s.id) || { totalSpent: 0, invoiceCount: 0 };
        return {
            id: s.id,
            name: s.name,
            category: s.category,
            gstin: s.gstin,
            outstandingBalance: Number(s.outstandingBalance || 0),
            last90DaySpend: Number(agg.totalSpent || 0),
            last90DayInvoices: Number(agg.invoiceCount || 0)
        };
    });
};

exports.getDashboardSummary = async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const sumField = async (model, where, field) => {
        const r = await model.findOne({ where, attributes: [[fn('SUM', col(field)), 'total']], raw: true });
        return Number(r?.total || 0);
    };

    const thisMonthOrders = await Order.findAll({ where: { isPaid: true, paidAt: { [Op.gte]: monthStart } } });
    const lastMonthOrders = await Order.findAll({ where: { isPaid: true, paidAt: { [Op.between]: [lastMonthStart, lastMonthEnd] } } });

    const thisMonthRevenue = thisMonthOrders.reduce((a, o) => a + Number(o.totalPrice || 0), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((a, o) => a + Number(o.totalPrice || 0), 0);
    const revenueChange = lastMonthRevenue > 0 ? +(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(2) : 0;

    const thisMonthExpenses = await sumField(Expense, { expenseDate: { [Op.gte]: monthStart } }, 'totalAmount');
    const lastMonthExpenses = await sumField(Expense, { expenseDate: { [Op.between]: [lastMonthStart, lastMonthEnd] } }, 'totalAmount');

    const pendingInvoices = await Invoice.count({ where: { status: { [Op.in]: ['Generated', 'Sent'] } } });
    const paidInvoices = await Invoice.count({ where: { status: 'Paid' } });
    const totalInvoices = await Invoice.count();
    const totalCustomers = await sequelize.query('SELECT COUNT(DISTINCT "UserId") AS c FROM "Orders"', { type: sequelize.QueryTypes.SELECT });
    const totalOrders = await Order.count();
    const totalProducts = await sequelize.query('SELECT COUNT(*) AS c FROM "Products"', { type: sequelize.QueryTypes.SELECT });

    return {
        revenue: {
            thisMonth: +thisMonthRevenue.toFixed(2),
            lastMonth: +lastMonthRevenue.toFixed(2),
            changePercent: revenueChange
        },
        expenses: {
            thisMonth: +thisMonthExpenses.toFixed(2),
            lastMonth: +lastMonthExpenses.toFixed(2)
        },
        netThisMonth: +(thisMonthRevenue - thisMonthExpenses).toFixed(2),
        invoices: { pending: pendingInvoices, paid: paidInvoices, total: totalInvoices },
        orders: { total: totalOrders },
        customers: { total: Number(totalCustomers[0]?.c || 0) },
        products: { total: Number(totalProducts[0]?.c || 0) }
    };
};

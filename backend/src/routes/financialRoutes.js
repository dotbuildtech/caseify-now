const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const c = require('../controllers/financialController');

// ============ CUSTOMER ROUTES (must come before :id) ============
router.get('/invoices/my', protect, validate({ query: c.financialSchemas.pagination }), c.getMyInvoices);
router.get('/invoices/my/:id', protect, c.getMyInvoice);
router.get('/invoices/my/:id/download', protect, c.downloadInvoicePDF);
router.get('/payments/my', protect, validate({ query: c.financialSchemas.pagination }), c.getMyPaymentHistory);
router.get('/payments/my/download.csv', protect, c.downloadMyPaymentsCsv);

// ============ REPORTS (CSV) ============
router.get('/reports/invoices.csv', protect, admin, c.downloadInvoicesCsv);
router.get('/reports/expenses.csv', protect, admin, c.downloadExpensesCsv);
router.get('/reports/suppliers.csv', protect, admin, c.downloadSuppliersCsv);
router.get('/reports/sales.csv', protect, admin, c.downloadSalesCsv);
router.get('/reports/payments.csv', protect, admin, c.downloadPaymentsCsv);

// ============ DASHBOARD & ANALYTICS ============
router.get('/dashboard', protect, admin, c.getDashboard);
router.get('/revenue', protect, admin, c.getRevenue);
router.get('/profit-loss', protect, admin, c.getProfitAndLoss);
router.get('/cash-inflow', protect, admin, c.getCashInflow);
router.get('/bank-comparison', protect, admin, c.getBankComparison);
router.get('/supplier-balances', protect, admin, c.getSupplierBalances);

// ============ INVOICE GENERATION ============
router.post('/invoices', protect, admin, c.generateInvoice);

// ============ SUPPLIERS ============
router.get('/suppliers', protect, admin, validate({ query: c.financialSchemas.suppliersQuery }), c.listSuppliers);
router.get('/suppliers/:id', protect, admin, c.getSupplier);
router.post('/suppliers', protect, admin, validate({ body: c.financialSchemas.supplier }), c.createSupplier);
router.put('/suppliers/:id', protect, admin, validate({ body: c.financialSchemas.supplier.partial() }), c.updateSupplier);
router.delete('/suppliers/:id', protect, admin, c.deleteSupplier);

// ============ EXPENSES ============
router.get('/expenses', protect, admin, validate({ query: c.financialSchemas.expensesQuery }), c.listExpenses);
router.get('/expenses/:id', protect, admin, c.getExpense);
router.post('/expenses', protect, admin, validate({ body: c.financialSchemas.expense }), c.createExpense);
router.put('/expenses/:id', protect, admin, validate({ body: c.financialSchemas.expense.partial() }), c.updateExpense);
router.delete('/expenses/:id', protect, admin, c.deleteExpense);

// ============ PAYMENT RECORDS ============
router.get('/payments', protect, admin, validate({ query: c.financialSchemas.paymentsQuery }), c.listPaymentRecords);
router.get('/payments/:id', protect, c.getPaymentRecord);
router.post('/payments', protect, admin, validate({ body: c.financialSchemas.payment }), c.createPaymentRecord);

module.exports = router;

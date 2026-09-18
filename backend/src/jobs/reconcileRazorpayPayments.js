const { Op } = require('sequelize');
const PaymentRecord = require('../models/PaymentRecord');
const { reconcileInitiatedPayment } = require('../services/razorpayService');
const { logSecurityEvent } = require('../utils/securityLog');

const RECONCILE_AGE_MINUTES = 15;
const RUN_INTERVAL_MS = 15 * 60 * 1000; // Run every 15 minutes

/**
 * Periodically searches for 'Initiated' Razorpay payments older than 15 minutes
 * and reconciles their status directly with Razorpay API in case webhooks/callbacks failed.
 */
const reconcileRazorpayPayments = async () => {
    const cutoff = new Date(Date.now() - RECONCILE_AGE_MINUTES * 60 * 1000);

    const pendingRecords = await PaymentRecord.findAll({
        where: {
            gateway: 'Razorpay',
            status: 'Initiated',
            createdAt: { [Op.lt]: cutoff },
            gatewayTransactionId: { [Op.ne]: null }
        },
        limit: 50
    });

    let reconciledCount = 0;
    for (const record of pendingRecords) {
        try {
            const outcome = await reconcileInitiatedPayment(record.id);
            if (outcome.reconciled) {
                reconciledCount++;
            }
        } catch (err) {
            const errorDetail = err?.error?.description || err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            console.error(`[reconcileRazorpayPayments] Error reconciling record ${record.id}:`, errorDetail);
        }
    }

    if (reconciledCount > 0) {
        console.log(`[job] reconcileRazorpayPayments: successfully reconciled ${reconciledCount} payment(s)`);
        logSecurityEvent('razorpay_reconciliation_batch_completed', {
            reconciledCount,
            method: 'JOB',
            path: '/jobs/reconcile-razorpay-payments'
        });
    }

    return reconciledCount;
};

const startRazorpayReconciliation = () => {
    reconcileRazorpayPayments().catch((e) => console.error('[job] initial reconciliation run failed:', e.message));
    setInterval(() => {
        reconcileRazorpayPayments().catch((e) => console.error('[job] reconciliation run failed:', e.message));
    }, RUN_INTERVAL_MS);
};

module.exports = {
    reconcileRazorpayPayments,
    startRazorpayReconciliation
};

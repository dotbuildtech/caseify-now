require('dotenv').config();
const { sequelize, connectDB } = require('./src/config/db');

async function seed() {
    await connectDB();
    const { Supplier, Expense, PaymentRecord, Invoice, Order, OrderItem, Product, User } = require('./src/models/associations');

    // Pick the seeded customer and admin
    const admin = await User.findOne({ where: { role: 'admin' } });
    const customer = await User.findOne({ where: { email: 'testcust_1292623886@example.com' } });
    if (!admin || !customer) {
        console.log('Missing seeded users - run tests first');
        process.exit(1);
    }

    // Suppliers
    const [supCount] = await Supplier.findOrCreate({ where: { name: 'Acme Plastics Pvt Ltd' }, defaults: {
        contactPerson: 'Rajesh Kumar', email: 'sales@acmeplastics.example', phone: '+91-22-12345670',
        gstin: '27AAACA1234A1Z5', pan: 'AAACA1234A', category: 'Raw Material', paymentTerms: 'Net 30',
        outstandingBalance: 0, isActive: true,
        address: { street: 'Plot 4, MIDC', city: 'Mumbai', state: 'Maharashtra', postalCode: '400093', country: 'India' },
        bankDetails: { accountName: 'Acme Plastics', accountNumber: '1234567890', ifsc: 'HDFC0001234', bankName: 'HDFC Bank', branch: 'Andheri' }
    } });
    const [sup2] = await Supplier.findOrCreate({ where: { name: 'BoxCraft Packaging' }, defaults: {
        contactPerson: 'Priya Sharma', email: 'orders@boxcraft.example', phone: '+91-11-98765432',
        gstin: '07AAACB5678B1Z9', pan: 'AAACB5678B', category: 'Packaging', paymentTerms: 'Net 15',
        outstandingBalance: 0, isActive: true
    } });
    const [sup3] = await Supplier.findOrCreate({ where: { name: 'BlueDart Couriers' }, defaults: {
        contactPerson: 'Anil Verma', email: 'billing@bluedart.example', phone: '+91-80-11112222',
        gstin: '29AAACD9999D1Z1', pan: 'AAACD9999D', category: 'Shipping', paymentTerms: 'Net 7',
        outstandingBalance: 0, isActive: true
    } });

    console.log('Suppliers:', supCount.id, sup2.id, sup3.id);

    // Wipe existing test data
    await OrderItem.destroy({ where: {}, force: true });
    await Order.destroy({ where: {}, force: true });
    await Expense.destroy({ where: {}, force: true });
    await PaymentRecord.destroy({ where: {}, force: true });
    await Invoice.destroy({ where: {}, force: true });

    // Expenses across the last 3 months
    const now = new Date();
    const months = [0, 1, 2];
    const expenseSeeds = [
        { title: 'Silicone sheets bulk', category: 'Raw Material', amount: 25000, gstAmount: 4500, paymentMethod: 'Bank Transfer', bankAccount: 'HDFC Current', SupplierId: supCount.id, status: 'Paid', daysAgo: 5 },
        { title: 'Custom phone-case mold', category: 'Raw Material', amount: 60000, gstAmount: 10800, paymentMethod: 'Bank Transfer', bankAccount: 'HDFC Current', SupplierId: supCount.id, status: 'Paid', daysAgo: 20 },
        { title: 'Mailer boxes 500pcs', category: 'Packaging', amount: 4500, gstAmount: 810, paymentMethod: 'UPI', bankAccount: 'HDFC Current', SupplierId: sup2.id, status: 'Paid', daysAgo: 7 },
        { title: 'Courier pickups - Mumbai', category: 'Shipping', amount: 3200, gstAmount: 576, paymentMethod: 'Bank Transfer', bankAccount: 'HDFC Current', SupplierId: sup3.id, status: 'Paid', daysAgo: 2 },
        { title: 'Courier pickups - Delhi', category: 'Shipping', amount: 4100, gstAmount: 738, paymentMethod: 'Bank Transfer', bankAccount: 'HDFC Current', SupplierId: sup3.id, status: 'Paid', daysAgo: 12 },
        { title: 'Google Ads - June', category: 'Marketing', amount: 15000, gstAmount: 2700, paymentMethod: 'Card', bankAccount: 'ICICI Credit Card', status: 'Paid', daysAgo: 10 },
        { title: 'Instagram influencer', category: 'Marketing', amount: 8000, gstAmount: 1440, paymentMethod: 'UPI', bankAccount: 'HDFC Current', status: 'Paid', daysAgo: 25 },
        { title: 'Office rent - May', category: 'Rent', amount: 35000, gstAmount: 6300, paymentMethod: 'Bank Transfer', bankAccount: 'HDFC Current', status: 'Paid', daysAgo: 35 },
        { title: 'Office rent - June', category: 'Rent', amount: 35000, gstAmount: 6300, paymentMethod: 'Bank Transfer', bankAccount: 'HDFC Current', status: 'Paid', daysAgo: 5 },
        { title: 'AWS hosting', category: 'Software', amount: 4500, gstAmount: 810, paymentMethod: 'Card', bankAccount: 'ICICI Credit Card', status: 'Paid', daysAgo: 1 },
        { title: 'Salaries - May', category: 'Salaries', amount: 180000, gstAmount: 0, paymentMethod: 'Bank Transfer', bankAccount: 'HDFC Current', status: 'Paid', daysAgo: 40 },
        { title: 'Salaries - June', category: 'Salaries', amount: 180000, gstAmount: 0, paymentMethod: 'Bank Transfer', bankAccount: 'HDFC Current', status: 'Paid', daysAgo: 10 },
        { title: 'Pending GST payment', category: 'Taxes', amount: 22000, gstAmount: 0, paymentMethod: 'Bank Transfer', bankAccount: 'HDFC Current', status: 'Pending', daysAgo: 15 }
    ];

    const created = [];
    for (const e of expenseSeeds) {
        const expDate = new Date(now.getTime() - e.daysAgo * 24 * 60 * 60 * 1000);
        const totalAmount = +(Number(e.amount) + Number(e.gstAmount)).toFixed(2);
        const r = await Expense.create({
            title: e.title,
            category: e.category,
            amount: e.amount,
            gstAmount: e.gstAmount,
            totalAmount,
            paymentMethod: e.paymentMethod,
            bankAccount: e.bankAccount,
            status: e.status,
            expenseDate: expDate,
            paidAt: e.status === 'Paid' ? expDate : null,
            SupplierId: e.SupplierId || null,
            tags: []
        });
        created.push(r);
        if (e.SupplierId && e.status === 'Paid') {
            const sup = await Supplier.findByPk(e.SupplierId);
            if (sup) {
                sup.outstandingBalance = +(Number(sup.outstandingBalance || 0) + totalAmount).toFixed(2);
                await sup.save();
            }
        }
    }
    console.log('Expenses:', created.length);

    // Get products
    const products = await Product.findAll({ where: { isActive: true } });
    if (products.length === 0) {
        console.log('No products - skip payments/invoices');
        process.exit(0);
    }

    // Paid orders + invoices + payment records
    const buyer = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: { address: 'A-12 Sea Breeze', city: 'Mumbai', state: 'Maharashtra', postalCode: '400050', country: 'India' }
    };
    const seller = {
        name: 'DotBuild Ecommerce Pvt Ltd',
        address: { street: '123 Tech Park', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' },
        gstin: '27AAAAA0000A1Z5', pan: 'AAAAA0000A', phone: '+91-22-12345678', email: 'billing@dotbuild.example',
        bankDetails: { accountName: 'DotBuild Ecommerce Pvt Ltd', accountNumber: '0000000000', ifsc: 'HDFC0000000', bankName: 'HDFC Bank', branch: 'Mumbai Main' }
    };

    const orderSeeds = [
        { daysAgo: 3, items: [{ p: products[0], qty: 2 }, { p: products[1] ? products[1] : products[0], qty: 1 }], gateway: 'Razorpay', bank: 'HDFC Current', method: 'UPI' },
        { daysAgo: 8, items: [{ p: products[0], qty: 1 }], gateway: 'Razorpay', bank: 'HDFC Current', method: 'Card' },
        { daysAgo: 15, items: [{ p: products[1] ? products[1] : products[0], qty: 3 }], gateway: 'Razorpay', bank: 'ICICI Current', method: 'NetBanking' },
        { daysAgo: 25, items: [{ p: products[0], qty: 1 }], gateway: 'Stripe', bank: 'Stripe USD', method: 'Card' },
        { daysAgo: 40, items: [{ p: products[0], qty: 4 }], gateway: 'Razorpay', bank: 'HDFC Current', method: 'UPI' },
        { daysAgo: 55, items: [{ p: products[1] ? products[1] : products[0], qty: 2 }], gateway: 'Razorpay', bank: 'HDFC Current', method: 'UPI' }
    ];

    let invSeq = 1;
    for (const o of orderSeeds) {
        const itemsPrice = o.items.reduce((a, i) => a + Number(i.p.price) * i.qty, 0);
        const taxPrice = +(itemsPrice * 0.18).toFixed(2);
        const shippingPrice = 50;
        const totalPrice = +(itemsPrice + taxPrice + shippingPrice).toFixed(2);
        const paidAt = new Date(now.getTime() - o.daysAgo * 24 * 60 * 60 * 1000);

        const order = await Order.create({
            UserId: customer.id,
            shippingAddress: buyer.address,
            paymentMethod: o.method,
            itemsPrice: +itemsPrice.toFixed(2),
            taxPrice,
            shippingPrice,
            totalPrice,
            isPaid: true,
            paidAt,
            isDelivered: o.daysAgo > 7,
            deliveredAt: o.daysAgo > 7 ? new Date(paidAt.getTime() + 4 * 24 * 60 * 60 * 1000) : null,
            razorpayOrderId: `rzp_test_${1000 + invSeq}`,
            orderStatus: o.daysAgo > 30 ? 'Delivered' : (o.daysAgo > 14 ? 'Shipped' : 'Processing')
        });
        for (const it of o.items) {
            await OrderItem.create({
                OrderId: order.id,
                ProductId: it.p.id,
                name: it.p.name,
                qty: it.qty,
                image: it.p.image || '',
                price: Number(it.p.price)
            });
        }
        const subTotal = +(itemsPrice - 0).toFixed(2);
        const cgst = +(subTotal * 0.09).toFixed(2);
        const sgst = +(subTotal * 0.09).toFixed(2);
        const gstTotal = +(cgst + sgst).toFixed(2);
        const grandTotal = +(subTotal + gstTotal + shippingPrice).toFixed(2);
        const invNumber = `INV-${new Date().getFullYear()}-${String(invSeq).padStart(6, '0')}`;
        invSeq += 1;
        const invoice = await Invoice.create({
            invoiceNumber: invNumber,
            subTotal,
            cgstTotal: cgst,
            sgstTotal: sgst,
            igstTotal: 0,
            gstTotal,
            discountTotal: 0,
            shippingTotal: shippingPrice,
            grandTotal,
            gstDetails: { cgstRate: 9, sgstRate: 9, igstRate: 0, hsnCode: '3926', placeOfSupply: 'Maharashtra', isInterState: false },
            sellerDetails: seller,
            buyerDetails: buyer,
            status: 'Paid',
            issuedAt: paidAt,
            paidAt,
            OrderId: order.id,
            UserId: customer.id
        });

        // Payment record with fee
        const fee = +(totalPrice * 0.02).toFixed(2);
        const tax = +(fee * 0.18).toFixed(2);
        const netAmount = +(totalPrice - fee - tax).toFixed(2);
        await PaymentRecord.create({
            transactionId: `PAY-${order.id}-${Date.now().toString().slice(-6)}`,
            gateway: o.gateway,
            gatewayTransactionId: order.razorpayOrderId,
            gatewayPaymentId: `pay_${1000 + invSeq}`,
            bankAccount: o.bank,
            bankName: o.bank,
            amount: totalPrice,
            fee,
            tax,
            netAmount,
            currency: 'INR',
            paymentMethod: o.method,
            status: 'Captured',
            paidAt,
            OrderId: order.id,
            UserId: customer.id,
            customerName: customer.name,
            customerEmail: customer.email
        });
    }

    console.log('Seeded', orderSeeds.length, 'paid orders with invoices and payments');
    process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });

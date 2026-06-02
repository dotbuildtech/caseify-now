const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoicePDF = async (order, invoice) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        // Header
        doc.fontSize(20).text('INVOICE', { align: 'right' });
        doc.fontSize(10).text(`Invoice Number: ${invoice.invoiceNumber}`, { align: 'right' });
        doc.text(`Date: ${new Date(invoice.issuedAt).toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        // Company Details
        doc.fontSize(12).text('DotBuild Ecommerce', { underline: true });
        doc.fontSize(10).text('Phone Cover Platform');
        doc.text('India');
        doc.moveDown();

        // Customer Details
        doc.fontSize(12).text('Bill To:', { underline: true });
        doc.fontSize(10).text(order.User.name);
        doc.text(order.User.email);
        doc.text(`${order.shippingAddress.address}, ${order.shippingAddress.city}`);
        doc.text(`${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`);
        doc.moveDown();

        // Table Header
        const tableTop = 250;
        doc.fontSize(10).text('Item', 50, tableTop);
        doc.text('Price', 300, tableTop, { width: 90, align: 'right' });
        doc.text('Qty', 400, tableTop, { width: 50, align: 'right' });
        doc.text('Total', 450, tableTop, { width: 100, align: 'right' });

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Table Content
        let currentHeight = tableTop + 25;
        order.OrderItems.forEach(item => {
            doc.text(item.name, 50, currentHeight);
            doc.text(item.price.toFixed(2), 300, currentHeight, { width: 90, align: 'right' });
            doc.text(item.qty.toString(), 400, currentHeight, { width: 50, align: 'right' });
            doc.text((item.price * item.qty).toFixed(2), 450, currentHeight, { width: 100, align: 'right' });
            currentHeight += 20;
        });

        doc.moveTo(50, currentHeight).lineTo(550, currentHeight).stroke();
        currentHeight += 10;

        // Totals
        doc.text('Subtotal:', 350, currentHeight, { width: 100, align: 'right' });
        doc.text(invoice.subTotal.toFixed(2), 450, currentHeight, { width: 100, align: 'right' });
        currentHeight += 15;

        doc.text('Tax (GST):', 350, currentHeight, { width: 100, align: 'right' });
        doc.text(invoice.gstTotal.toFixed(2), 450, currentHeight, { width: 100, align: 'right' });
        currentHeight += 15;

        doc.fontSize(12).text('Grand Total:', 350, currentHeight, { width: 100, align: 'right' });
        doc.text(invoice.grandTotal.toFixed(2), 450, currentHeight, { width: 100, align: 'right' });

        // Footer
        doc.fontSize(10).text('Thank you for your business!', 50, 700, { align: 'center' });

        doc.end();
    });
};

module.exports = { generateInvoicePDF };

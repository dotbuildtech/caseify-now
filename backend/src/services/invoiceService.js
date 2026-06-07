const PDFDocument = require('pdfkit');

const fmt = (n) => (Number(n || 0)).toFixed(2);
const safe = (v) => (v == null ? '' : String(v));

const generateInvoicePDF = async (order, invoice) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const buffers = [];
            doc.on('data', (b) => buffers.push(b));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const seller = invoice.sellerDetails || {};
            const buyer = invoice.buyerDetails || order.User || {};
            const buyerAddr = buyer.address || order.shippingAddress || {};
            const sellerAddr = seller.address || {};
            const gst = invoice.gstDetails || {};
            const items = (order.items && order.items.length) ? order.items : (order.OrderItems || []);

            // Header
            doc.fontSize(22).text('TAX INVOICE', { align: 'right' });
            doc.fontSize(9).fillColor('#444')
                .text(`Invoice #: ${invoice.invoiceNumber}`, { align: 'right' })
                .text(`Issued: ${new Date(invoice.issuedAt).toLocaleDateString()}`, { align: 'right' });
            if (invoice.dueAt) doc.text(`Due: ${new Date(invoice.dueAt).toLocaleDateString()}`, { align: 'right' });
            doc.fillColor('black').moveDown(0.5);

            // Seller
            doc.fontSize(11).text(safe(seller.name) || 'Seller', { continued: false });
            doc.fontSize(8).fillColor('#444');
            if (sellerAddr.street) doc.text(safe(sellerAddr.street));
            doc.text(`${safe(sellerAddr.city)}, ${safe(sellerAddr.state)} ${safe(sellerAddr.postalCode)}`);
            if (sellerAddr.country) doc.text(safe(sellerAddr.country));
            if (seller.gstin) doc.text(`GSTIN: ${seller.gstin}`);
            if (seller.pan) doc.text(`PAN: ${seller.pan}`);
            if (seller.phone) doc.text(`Phone: ${seller.phone}`);
            if (seller.email) doc.text(`Email: ${seller.email}`);
            doc.fillColor('black').moveDown(0.5);

            // Buyer
            doc.fontSize(10).text('Bill To:', { underline: true });
            doc.fontSize(9).fillColor('#444')
                .text(safe(buyer.name))
                .text(safe(buyer.email))
                .text(safe(buyerAddr.address))
                .text(`${safe(buyerAddr.city)}, ${safe(buyerAddr.state)} ${safe(buyerAddr.postalCode)}`)
                .text(safe(buyerAddr.country));
            if (buyer.gstin) doc.text(`GSTIN: ${buyer.gstin}`);
            doc.fillColor('black').moveDown(0.5);

            // Items table
            const tableTop = doc.y + 5;
            const colX = { item: 40, hsn: 250, qty: 320, price: 370, total: 450, gst: 510 };
            doc.fontSize(9);
            doc.text('Item', colX.item, tableTop);
            doc.text('HSN', colX.hsn, tableTop);
            doc.text('Qty', colX.qty, tableTop, { width: 40, align: 'right' });
            doc.text('Price', colX.price, tableTop, { width: 70, align: 'right' });
            doc.text('Total', colX.total, tableTop, { width: 50, align: 'right' });
            doc.text('GST', colX.gst, tableTop, { width: 50, align: 'right' });
            doc.moveTo(40, tableTop + 12).lineTo(560, tableTop + 12).strokeColor('#999').stroke();
            doc.strokeColor('black');

            let y = tableTop + 16;
            items.forEach((it) => {
                const lineTotal = Number(it.price || 0) * Number(it.qty || 0);
                const lineGstRate = (gst.cgstRate || 0) + (gst.sgstRate || 0) + (gst.igstRate || 0);
                doc.fontSize(8);
                doc.text(safe(it.name).slice(0, 28), colX.item, y, { width: 200 });
                doc.text(safe(gst.hsnCode || '-'), colX.hsn, y);
                doc.text(String(it.qty), colX.qty, y, { width: 40, align: 'right' });
                doc.text(fmt(it.price), colX.price, y, { width: 70, align: 'right' });
                doc.text(fmt(lineTotal), colX.total, y, { width: 50, align: 'right' });
                doc.text(`${lineGstRate}%`, colX.gst, y, { width: 50, align: 'right' });
                y += 18;
            });

            doc.moveTo(40, y).lineTo(560, y).strokeColor('#999').stroke();
            doc.strokeColor('black');
            y += 10;

            // Totals (right-aligned block)
            const rightLabelX = 380, rightValX = 510;
            const drawRow = (label, val, bold = false) => {
                doc.fontSize(bold ? 10 : 9);
                if (bold) doc.font('Helvetica-Bold');
                doc.text(label, rightLabelX, y, { width: 120, align: 'right' });
                doc.text(`Rs. ${val}`, rightValX, y, { width: 50, align: 'right' });
                if (bold) doc.font('Helvetica');
                y += 16;
            };
            drawRow('Subtotal:', fmt(invoice.subTotal));
            if (Number(invoice.discountTotal) > 0) drawRow('Discount:', `-${fmt(invoice.discountTotal)}`);
            if (Number(invoice.cgstTotal) > 0) drawRow(`CGST @${gst.cgstRate || 0}%:`, fmt(invoice.cgstTotal));
            if (Number(invoice.sgstTotal) > 0) drawRow(`SGST @${gst.sgstRate || 0}%:`, fmt(invoice.sgstTotal));
            if (Number(invoice.igstTotal) > 0) drawRow(`IGST @${gst.igstRate || 0}%:`, fmt(invoice.igstTotal));
            if (Number(invoice.shippingTotal) > 0) drawRow('Shipping:', fmt(invoice.shippingTotal));
            y += 4;
            doc.moveTo(380, y).lineTo(560, y).stroke();
            y += 4;
            drawRow('Grand Total:', fmt(invoice.grandTotal), true);

            // Bank details
            y += 10;
            if (seller.bankDetails && seller.bankDetails.accountNumber) {
                doc.fontSize(9).font('Helvetica-Bold').text('Bank Details (for payment):', 40, y);
                y += 14;
                doc.font('Helvetica').fontSize(8);
                doc.text(`Bank: ${safe(seller.bankDetails.bankName)} | A/C: ${safe(seller.bankDetails.accountNumber)} | IFSC: ${safe(seller.bankDetails.ifsc)}`, 40, y);
                y += 12;
                doc.text(`Beneficiary: ${safe(seller.bankDetails.accountName)}`, 40, y);
                y += 16;
            }

            if (invoice.notes) {
                doc.fontSize(8).fillColor('#444').text(`Notes: ${invoice.notes}`, 40, y, { width: 520 });
                y += 20;
            }

            // Footer
            doc.fontSize(8).fillColor('#888').text('This is a computer-generated GST invoice. Thank you for your business.', 40, 780, { align: 'center', width: 520 });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = { generateInvoicePDF };

const PDFDocument = require('pdfkit');
const { shortOrderId, money, formatDate } = require('./orderFormat');

const LEFT = 50;
const RIGHT = 545;
const PAGE_BOTTOM = 760;

// Table columns: [x, width, alignment]
const COLUMNS = {
    item: [LEFT, 170, 'left'],
    variant: [225, 100, 'left'],
    qty: [330, 35, 'right'],
    price: [370, 80, 'right'],
    subtotal: [455, 90, 'right'],
};

// Builds the PDF receipt for an order and resolves with a Buffer.
// `user` is { name, email }. The standard PDF fonts don't have the peso sign, so amounts use "PHP".
exports.buildReceiptPdf = (order, user) =>
    new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const ship = order.shippingInfo;
            const id = shortOrderId(order._id);

            // Header
            doc.font('Helvetica-Bold').fontSize(26).fillColor('#1f1f1f').text('OOTD', LEFT, 50);
            doc.font('Helvetica').fontSize(9).fillColor('#666666').text('Own. Outfit. Today.', LEFT, 80);
            doc.font('Helvetica-Bold').fontSize(16).fillColor('#1f1f1f').text('RECEIPT', LEFT, 50, {
                width: RIGHT - LEFT,
                align: 'right',
            });

            // Customer and order details, side by side
            const shipLines = [
                user?.name,
                ship.address,
                `${ship.city}, ${ship.postalCode}`,
                ship.country,
                `Phone: ${ship.phoneNo}`,
                user?.email,
            ]
                .filter(Boolean)
                .join('\n');
            const orderLines = [
                `Order: ${id}`,
                `Date: ${formatDate(order.createdAt)}`,
                `Status: ${order.orderStatus}`,
                `Payment: ${order.paymentMethod}`,
                order.deliveredAt ? `Delivered: ${formatDate(order.deliveredAt)}` : null,
            ]
                .filter(Boolean)
                .join('\n');

            let y = 120;
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#1f1f1f');
            doc.text('Ship to', LEFT, y);
            doc.text('Order details', 330, y);

            doc.font('Helvetica').fontSize(10).fillColor('#333333');
            doc.text(shipLines, LEFT, y + 16, { width: 240 });
            const shipHeight = doc.heightOfString(shipLines, { width: 240 });
            doc.text(orderLines, 330, y + 16, { width: 215 });
            const orderHeight = doc.heightOfString(orderLines, { width: 215 });

            y += 16 + Math.max(shipHeight, orderHeight) + 24;

            // Items table
            const drawTableHeader = () => {
                doc.font('Helvetica-Bold').fontSize(9).fillColor('#1f1f1f');
                const labels = { item: 'Item', variant: 'Size / Color', qty: 'Qty', price: 'Price', subtotal: 'Subtotal' };
                Object.entries(COLUMNS).forEach(([key, [x, width, align]]) => {
                    doc.text(labels[key], x, y, { width, align });
                });
                y += 16;
                doc.moveTo(LEFT, y).lineTo(RIGHT, y).strokeColor('#1f1f1f').lineWidth(1).stroke();
                y += 8;
            };
            drawTableHeader();

            doc.font('Helvetica').fontSize(10).fillColor('#333333');
            order.orderItems.forEach((item) => {
                const cells = {
                    item: item.name,
                    variant: `${item.size} / ${item.color}`,
                    qty: String(item.quantity),
                    price: money(item.price),
                    subtotal: money(item.price * item.quantity),
                };

                // Row height follows whichever cell wraps the most
                const rowHeight =
                    Math.max(
                        ...Object.entries(COLUMNS).map(([key, [, width]]) => doc.heightOfString(cells[key], { width }))
                    ) + 10;

                if (y + rowHeight > PAGE_BOTTOM) {
                    doc.addPage();
                    y = 50;
                    drawTableHeader();
                    doc.font('Helvetica').fontSize(10).fillColor('#333333');
                }

                Object.entries(COLUMNS).forEach(([key, [x, width, align]]) => {
                    doc.text(cells[key], x, y, { width, align });
                });
                y += rowHeight;
                doc.moveTo(LEFT, y - 4).lineTo(RIGHT, y - 4).strokeColor('#e5e0d8').lineWidth(0.5).stroke();
            });

            // Totals
            if (y + 90 > PAGE_BOTTOM) {
                doc.addPage();
                y = 50;
            }
            y += 12;
            const totalRow = (label, value, bold) => {
                doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10).fillColor('#1f1f1f');
                doc.text(label, 330, y, { width: 120 });
                doc.text(`PHP ${money(value)}`, 400, y, { width: RIGHT - 400, align: 'right' });
                y += bold ? 22 : 18;
            };
            totalRow('Items', order.itemsPrice, false);
            totalRow('Shipping', order.shippingPrice, false);
            doc.moveTo(330, y - 4).lineTo(RIGHT, y - 4).strokeColor('#1f1f1f').lineWidth(1).stroke();
            y += 4;
            totalRow('Total', order.totalPrice, true);

            doc.font('Helvetica').fontSize(9).fillColor('#666666');
            doc.text('Thank you for shopping with OOTD!', LEFT, y + 30, { width: RIGHT - LEFT, align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });

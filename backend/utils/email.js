
const nodemailer = require('nodemailer');
const { buildReceiptPdf } = require('./receipt');
const {
    shortOrderId,
    money,
    formatDate,
    escapeHtml
} = require('./orderFormat');

const STATUS_MESSAGES = {
    Processing: 'Your order has been received and is being processed.',
    Shipped: 'Your order has been shipped.',
    Delivered: 'Your order has been delivered.',
    Cancelled: 'Your order has been cancelled.'
};

function getTransporter() {
    const {
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS
    } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.warn('Email skipped: SMTP configuration is incomplete.');
        return null;
    }

    const port = Number(SMTP_PORT || 2525);

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });
}

exports.buildOrderEmail = (order, user) => {
    const id = shortOrderId(order._id);
    const status = order.orderStatus;
    const intro = STATUS_MESSAGES[status] || `Your order status is now ${status}.`;
    const subject =
        status === 'Processing' ? `We got your OOTD order ${id}` : `Your OOTD order ${id} is now ${status}`;

    const rows = order.orderItems
        .map(
            (item) => `
            <tr>
                <td style="padding:8px;border-bottom:1px solid #e5e0d8;">
                    ${escapeHtml(item.name)}<br>
                    <span style="color:#666;font-size:12px;">${escapeHtml(item.size)} / ${escapeHtml(item.color)}</span>
                </td>
                <td style="padding:8px;border-bottom:1px solid #e5e0d8;text-align:right;">${item.quantity}</td>
                <td style="padding:8px;border-bottom:1px solid #e5e0d8;text-align:right;">₱${money(item.price)}</td>
                <td style="padding:8px;border-bottom:1px solid #e5e0d8;text-align:right;">₱${money(item.price * item.quantity)}</td>
            </tr>`
        )
        .join('');

    const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f1f1f;">
        <h1 style="margin-bottom:0;">OOTD</h1>
        <p style="margin-top:0;color:#666;">Own. Outfit. Today.</p>

        <p>Hi ${escapeHtml(user?.name || 'there')},</p>
        <p>${escapeHtml(intro)}</p>
        <p><strong>Order ${id}</strong> · ${formatDate(order.createdAt)} · Status: <strong>${escapeHtml(status)}</strong></p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
                <tr style="background:#faf8f5;">
                    <th style="padding:8px;text-align:left;">Item</th>
                    <th style="padding:8px;text-align:right;">Qty</th>
                    <th style="padding:8px;text-align:right;">Price</th>
                    <th style="padding:8px;text-align:right;">Subtotal</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
                <tr><td colspan="3" style="padding:8px;text-align:right;">Items</td><td style="padding:8px;text-align:right;">₱${money(order.itemsPrice)}</td></tr>
                <tr><td colspan="3" style="padding:8px;text-align:right;">Shipping</td><td style="padding:8px;text-align:right;">₱${money(order.shippingPrice)}</td></tr>
                <tr><td colspan="3" style="padding:8px;text-align:right;font-weight:bold;">Grand total</td><td style="padding:8px;text-align:right;font-weight:bold;">₱${money(order.totalPrice)}</td></tr>
            </tfoot>
        </table>

        <p style="font-size:14px;"><strong>Shipping to:</strong><br>
            ${escapeHtml(order.shippingInfo.address)}<br>
            ${[order.shippingInfo.city, order.shippingInfo.region, order.shippingInfo.postalCode, order.shippingInfo.country].filter(Boolean).map(escapeHtml).join(', ')}<br>
            Phone: ${escapeHtml(order.shippingInfo.phoneNo)}
        </p>
        <p style="font-size:14px;">Payment: ${escapeHtml(order.paymentMethod)}. Your PDF receipt is attached.</p>
    </div>`;

    const text = [
        `Hi ${user?.name || 'there'},`,
        '',
        intro,
        `Order ${id} - Status: ${status}`,
        '',
        ...order.orderItems.map(
            (i) => `${i.name} (${i.size} / ${i.color}) x${i.quantity}  PHP ${money(i.price * i.quantity)}`
        ),
        '',
        `Grand total: PHP ${money(order.totalPrice)}`,
        '',
        'Your PDF receipt is attached.',
    ].join('\n');

    return { subject, html, text };
};

exports.sendOrderStatusEmail = async (order, user) => {
    try {
        if (!user?.email) {
            console.warn('Order email skipped: customer email is missing.');
            return;
        }

        const mailer = getTransporter();

        if (!mailer) return;

        const pdf = await buildReceiptPdf(order, user);
        const { subject, html, text } =
            exports.buildOrderEmail(order, user);

        const info = await mailer.sendMail({
            from: process.env.EMAIL_FROM || `OOTD <${process.env.SMTP_USER}>`,
            to: user.email,
            subject,
            text,
            html,
            attachments: [
                {
                    filename: `OOTD-receipt-${shortOrderId(order._id).slice(1)}.pdf`,
                    content: pdf,
                    contentType: 'application/pdf'
                }
            ]
        });

        console.log('Order email accepted:', info.messageId);
    } catch (error) {
        console.error('Order email failed:', error.message);
    }
};

// TTL · Transactions — status emails with the item table, subtotal and grand total.
// sendOrderStatusEmail() is called by newOrder + updateOrder; attaches the PDF from utils/receipt.js.
const nodemailer = require('nodemailer');
const { buildReceiptPdf } = require('./receipt');
const { shortOrderId, money, formatDate, escapeHtml } = require('./orderFormat');

const STATUS_MESSAGES = {
    Processing: 'Your order has been received and is being processed.',
    Shipped: 'Your order has been shipped.',
    Delivered: 'Your order has been delivered.',
    Cancelled: 'Your order has been cancelled.',
};

function getTransporter() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

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
            pass: SMTP_PASS,
        },
    });
}

exports.buildOrderEmail = (order, user) => {
    const id = shortOrderId(order._id);
    const status = order.orderStatus;
    const intro = STATUS_MESSAGES[status] || `Your order status is now ${status}.`;
    const subject =
        status === 'Processing'
            ? `We got your OOTD order ${id}`
            : `Your OOTD order ${id} is now ${status}`;

    const cellStyle = 'padding:8px;border-bottom:1px solid #e5e0d8;text-align:right;';
    const rows = order.orderItems
        .map((item) => {
            const variant = `${escapeHtml(item.size)} / ${escapeHtml(item.color)}`;

            return `
            <tr>
                <td style="padding:8px;border-bottom:1px solid #e5e0d8;">
                    ${escapeHtml(item.name)}<br>
                    <span style="color:#666;font-size:12px;">${variant}</span>
                </td>
                <td style="${cellStyle}">${item.quantity}</td>
                <td style="${cellStyle}">₱${money(item.price)}</td>
                <td style="${cellStyle}">₱${money(item.price * item.quantity)}</td>
            </tr>`;
        })
        .join('');

    const wrapperStyle =
        'font-family:Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f1f1f;';
    const orderLine =
        `<strong>Order ${id}</strong> · ${formatDate(order.createdAt)} · ` +
        `Status: <strong>${escapeHtml(status)}</strong>`;
    const location = [
        order.shippingInfo.city,
        order.shippingInfo.region,
        order.shippingInfo.postalCode,
        order.shippingInfo.country,
    ]
        .filter(Boolean)
        .map(escapeHtml)
        .join(', ');
    const payment = escapeHtml(order.paymentMethod);
    const totalRow = (label, amount, bold = false) => {
        const style = `padding:8px;text-align:right;${bold ? 'font-weight:bold;' : ''}`;

        return (
            `<tr><td colspan="3" style="${style}">${label}</td>` +
            `<td style="${style}">₱${money(amount)}</td></tr>`
        );
    };

    const html = `
    <div style="${wrapperStyle}">
        <h1 style="margin-bottom:0;">OOTD</h1>
        <p style="margin-top:0;color:#666;">Own. Outfit. Today.</p>

        <p>Hi ${escapeHtml(user?.name || 'there')},</p>
        <p>${escapeHtml(intro)}</p>
        <p>${orderLine}</p>

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
                ${totalRow('Items', order.itemsPrice)}
                ${totalRow('Shipping', order.shippingPrice)}
                ${totalRow('Grand total', order.totalPrice, true)}
            </tfoot>
        </table>

        <p style="font-size:14px;"><strong>Shipping to:</strong><br>
            ${escapeHtml(order.shippingInfo.address)}<br>
            ${location}<br>
            Phone: ${escapeHtml(order.shippingInfo.phoneNo)}
        </p>
        <p style="font-size:14px;">Payment: ${payment}. Your PDF receipt is attached.</p>
    </div>`;

    const text = [
        `Hi ${user?.name || 'there'},`,
        '',
        intro,
        `Order ${id} - Status: ${status}`,
        '',
        ...order.orderItems.map((i) => {
            const total = money(i.price * i.quantity);

            return `${i.name} (${i.size} / ${i.color}) x${i.quantity}  PHP ${total}`;
        }),
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
        const { subject, html, text } = exports.buildOrderEmail(order, user);

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
                    contentType: 'application/pdf',
                },
            ],
        });

        console.log('Order email accepted:', info.messageId);
    } catch (error) {
        console.error('Order email failed:', error.message);
    }
};

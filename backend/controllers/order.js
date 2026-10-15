const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const { buildReceiptPdf } = require('../utils/receipt');
const { sendOrderStatusEmail } = require('../utils/email');
const { shortOrderId } = require('../utils/orderFormat');
const { getColorImageUrl } = require('../utils/productImages');
const { PAYMENT_METHODS } = require('../utils/constants');

const SHIPPING_PRICE = 0;
const MAX_QUANTITY_PER_ITEM = 20;

// Order status flow. Delivered and Cancelled are final.
const NEXT_STATUSES = {
    Processing: ['Shipped', 'Cancelled'],
    Shipped: ['Delivered', 'Cancelled'],
    Delivered: [],
    Cancelled: [],
};

const fail = (res, status, message) => res.status(status).json({ success: false, message });

const reserveStock = async ({ product, size, color, quantity }) => {
    const result = await Product.updateOne(
        { _id: product, variants: { $elemMatch: { size, color, stock: { $gte: quantity } } } },
        { $inc: { 'variants.$.stock': -quantity } }
    );
    return result.modifiedCount === 1;
};

// Puts stock back (cancelled order, or a failed checkout)
const restoreStock = async (items) => {
    await Promise.all(
        items.map((item) =>
            Product.updateOne(
                { _id: item.product },
                { $inc: { 'variants.$[v].stock': item.quantity } },
                { arrayFilters: [{ 'v.size': item.size, 'v.color': item.color }] }
            ).catch((err) => console.error('Restock failed:', item.product, err.message))
        )
    );
};

// POST /api/v1/order/new
// The client only sends product, size, color, and quantity. Names, images and
// prices are read from the database, so they can't be tampered with.
exports.newOrder = async (req, res) => {
    const { orderItems, shippingInfo } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return fail(res, 400, 'Your cart is empty');
    }

    // Merge duplicate lines (same product + size + color) and validate each one
    const lines = new Map();
    for (const item of orderItems) {
        const quantity = Number(item?.quantity);
        if (
            !mongoose.isValidObjectId(item?.product) ||
            typeof item.size !== 'string' ||
            typeof item.color !== 'string' ||
            !Number.isInteger(quantity) ||
            quantity < 1
        ) {
            return fail(res, 400, 'Your cart contains an invalid item');
        }
        const key = `${item.product}|${item.size}|${item.color}`;
        const line = lines.get(key);
        if (line) line.quantity += quantity;
        else lines.set(key, { product: item.product, size: item.size, color: item.color, quantity });
    }
    const requested = [...lines.values()];

    // Cash on Delivery unless the customer chose a listed method
    const paymentMethod = req.body.paymentMethod ?? 'Cash on Delivery';
    if (!PAYMENT_METHODS.includes(paymentMethod)) return fail(res, 400, 'Choose a valid payment method');
    const paidNow = paymentMethod !== 'Cash on Delivery';

    if (requested.some((l) => l.quantity > MAX_QUANTITY_PER_ITEM)) {
        return fail(res, 400, `You can order up to ${MAX_QUANTITY_PER_ITEM} of the same item`);
    }

    const products = await Product.find({ _id: { $in: requested.map((l) => l.product) } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    // Build the order lines from the database and do a first stock check
    const builtItems = [];
    for (const line of requested) {
        const product = productMap.get(String(line.product));
        if (!product || product.isActive === false) return fail(res, 400, 'A product in your cart is no longer available');

        const variant = product.variants.find((v) => v.size === line.size && v.color === line.color);
        if (!variant) {
            return fail(res, 400, `${product.name} is no longer available in ${line.size} / ${line.color}`);
        }
        if (variant.stock < line.quantity) {
            const message =
                variant.stock === 0
                    ? `${product.name} (${line.size} / ${line.color}) is out of stock`
                    : `Only ${variant.stock} left of ${product.name} (${line.size} / ${line.color})`;
            return fail(res, 400, message);
        }

        builtItems.push({
            product: product._id,
            name: product.name,
            image: getColorImageUrl(product, line.color),
            size: line.size,
            color: line.color,
            price: product.price,
            quantity: line.quantity,
        });
    }

    // Reserve stock line by line; if any line fails, give back what was taken
    const reserved = [];
    for (const item of builtItems) {
        const ok = await reserveStock(item);
        if (!ok) {
            await restoreStock(reserved);
            return fail(
                res,
                409,
                `Sorry, ${item.name} (${item.size} / ${item.color}) just ran out of stock. Please update your cart.`
            );
        }
        reserved.push(item);
    }

    const itemsPrice = builtItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    try {
        const order = await Order.create({
            user: req.user._id,
            shippingInfo,
            orderItems: builtItems,
            paymentMethod,
            isPaid: paidNow,
            paidAt: paidNow ? Date.now() : undefined,
            itemsPrice,
            shippingPrice: SHIPPING_PRICE,
            totalPrice: itemsPrice + SHIPPING_PRICE,
        });

        // Order confirmation email with the receipt. Not awaited, and it can't fail the order.
        sendOrderStatusEmail(order, req.user);

        return res.status(201).json({ success: true, order });
    } catch (error) {
        // Bad shipping info etc.: the order wasn't saved, so release the stock
        await restoreStock(reserved);
        throw error;
    }
};

// GET /api/v1/orders/me
exports.myOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: orders.length, orders });
};

// GET /api/v1/order/:id   (the order's owner, or an admin)
exports.getSingleOrder = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Order not found');

    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return fail(res, 404, 'Order not found');

    const isOwner = String(order.user._id) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
        // Same message as "not found" so order ids can't be guessed
        return fail(res, 404, 'Order not found');
    }

    return res.status(200).json({ success: true, order });
};

// GET /api/v1/admin/orders
exports.allOrders = async (req, res) => {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });

    // Cancelled orders don't count as sales
    const totalAmount = orders
        .filter((o) => o.orderStatus !== 'Cancelled')
        .reduce((sum, o) => sum + o.totalPrice, 0);

    return res.status(200).json({ success: true, count: orders.length, totalAmount, orders });
};

// PUT /api/v1/admin/order/:id   body: { status }
exports.updateOrder = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Order not found');

    const order = await Order.findById(req.params.id);
    if (!order) return fail(res, 404, 'Order not found');

    const { status } = req.body;
    if (!Object.keys(NEXT_STATUSES).includes(status)) return fail(res, 400, 'Invalid order status');

    if (NEXT_STATUSES[order.orderStatus].length === 0) {
        return fail(res, 400, `This order is already ${order.orderStatus.toLowerCase()} and can't be changed`);
    }
    if (!NEXT_STATUSES[order.orderStatus].includes(status)) {
        return fail(res, 400, `An order that is ${order.orderStatus} can't be changed to ${status}`);
    }

    order.orderStatus = status;
    if (status === 'Delivered') order.deliveredAt = Date.now();
    await order.save();

    // A cancelled order puts its items back in stock
    if (status === 'Cancelled') await restoreStock(order.orderItems);

    // Tell the customer about the new status (not awaited, and it can't fail the update)
    const customer = await User.findById(order.user).select('name email');
    sendOrderStatusEmail(order, customer);

    return res.status(200).json({ success: true, order });
};

// DELETE /api/v1/admin/order/:id
exports.deleteOrder = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Order not found');

    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return fail(res, 404, 'Order not found');

    // An order that was still open had its stock reserved, so release it
    if (order.orderStatus === 'Processing' || order.orderStatus === 'Shipped') {
        await restoreStock(order.orderItems);
    }

    return res.status(200).json({ success: true, message: 'Order deleted' });
};

// GET /api/v1/order/:id/receipt   (the order's owner, or an admin)
exports.downloadReceipt = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Order not found');

    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return fail(res, 404, 'Order not found');

    const isOwner = order.user && String(order.user._id) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') return fail(res, 404, 'Order not found');

    const pdf = await buildReceiptPdf(order, order.user);
    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="OOTD-receipt-${shortOrderId(order._id).slice(1)}.pdf"`,
    });
    return res.send(pdf);
};


// GET /api/v1/admin/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD
// Everything the admin dashboard needs in one request, filtered by an inclusive date range.
// Defaults to January 1st of this year up to today. Cancelled orders don't count as sales.
const TIMEZONE = 'Asia/Manila'; // dates are interpreted as Philippine local days
const TZ_OFFSET = '+08:00';
const DAY_MS = 24 * 60 * 60 * 1000;

const isValidDateString = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
};

// Builds every day (or month) key between from and to so empty periods show as 0 on the chart
const buildBuckets = (from, to, granularity) => {
    const buckets = [];
    const end = new Date(`${to}T00:00:00Z`);
    let cursor = new Date(`${from}T00:00:00Z`);

    if (granularity === 'hour') {
        for (let h = 0; h < 24; h++) {
            buckets.push({
                key: String(h).padStart(2, '0'),
                label: `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`,
            });
        }
    } else if (granularity === 'month') {
        cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1));
        while (cursor <= end) {
            buckets.push({
                key: cursor.toISOString().slice(0, 7),
                label: cursor.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
            });
            cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
        }
    } else {
        while (cursor <= end) {
            buckets.push({
                key: cursor.toISOString().slice(0, 10),
                label: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
            });
            cursor = new Date(cursor.getTime() + DAY_MS);
        }
    }
    return buckets;
};

exports.dashboardStats = async (req, res) => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
    const from = req.query.from || `${today.slice(0, 4)}-01-01`;
    const to = req.query.to || today;

    if (!isValidDateString(from) || !isValidDateString(to)) {
        return res.status(400).json({ success: false, message: 'Dates must be valid and use the YYYY-MM-DD format' });
    }
    if (from > to) {
        return res.status(400).json({ success: false, message: 'The start date cannot be after the end date' });
    }

    const start = new Date(`${from}T00:00:00${TZ_OFFSET}`);
    const endExclusive = new Date(new Date(`${to}T00:00:00${TZ_OFFSET}`).getTime() + DAY_MS);
    const inRange = { createdAt: { $gte: start, $lt: endExclusive } };
    const notCancelled = { ...inRange, orderStatus: { $ne: 'Cancelled' } };

    // A single day is shown hour by hour, up to ~3 months day by day, anything longer month by month
    const rangeDays = Math.round((endExclusive - start) / DAY_MS);
    const granularity = rangeDays === 1 ? 'hour' : rangeDays <= 92 ? 'day' : 'month';
    const dateFormat = { hour: '%H', day: '%Y-%m-%d', month: '%Y-%m' }[granularity];

    const [totals, salesOverTime, productSales, customerSales, totalProducts, totalUsers] = await Promise.all([
        Order.aggregate([
            { $match: inRange },
            { $group: { _id: null, totalOrders: { $sum: 1 } } },
        ]),
        Order.aggregate([
            { $match: notCancelled },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: TIMEZONE } },
                    total: { $sum: '$totalPrice' },
                    orders: { $sum: 1 },
                },
            },
        ]),
        Order.aggregate([
            { $match: notCancelled },
            { $unwind: '$orderItems' },
            {
                $group: {
                    _id: '$orderItems.name',
                    unitsSold: { $sum: '$orderItems.quantity' },
                    total: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
                },
            },
            { $sort: { total: -1 } },
            { $limit: 10 },
        ]),
        Order.aggregate([
            { $match: notCancelled },
            { $group: { _id: '$user', total: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
            { $sort: { total: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $project: { total: 1, orders: 1, name: { $ifNull: [{ $arrayElemAt: ['$user.name', 0] }, 'Deleted user'] } } },
        ]),
        Product.countDocuments(),
        User.countDocuments(),
    ]);

    const series = buildBuckets(from, to, granularity).map(({ key, label }) => {
        const found = salesOverTime.find((b) => b._id === key);
        return { date: key, label, total: found ? found.total : 0, orders: found ? found.orders : 0 };
    });

    const totalSales = series.reduce((sum, b) => sum + b.total, 0);
    const paidOrders = series.reduce((sum, b) => sum + b.orders, 0);

    return res.status(200).json({
        success: true,
        from,
        to,
        granularity,
        totalOrders: totals[0] ? totals[0].totalOrders : 0,
        totalSales,
        averageOrderValue: paidOrders ? totalSales / paidOrders : 0,
        totalProducts,
        totalUsers,
        salesOverTime: series,
        productSales: productSales.map((p) => ({ name: p._id, unitsSold: p.unitsSold, total: p.total })),
        customerSales: customerSales.map((c) => ({ name: c.name, orders: c.orders, total: c.total })),
    });
};
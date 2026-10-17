const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const { buildReceiptPdf } = require('../utils/receipt');
const { sendOrderStatusEmail } = require('../utils/email');
const { shortOrderId } = require('../utils/orderFormat');
const { getColorImageUrl, getColorImages } = require('../utils/productImages');
const { PAYMENT_METHODS } = require('../utils/constants');

const SHIPPING_PRICE = 0;
const MAX_QUANTITY_PER_ITEM = 20;

// Order status flow. Delivered and Cancelled are final.
const NEXT_STATUSES = {
    Processing: ['Shipped', 'Cancelled'],
    Shipped: ['Delivered'],
    Delivered: [],
    Cancelled: [],
};

const fail = (res, status, message) => res.status(status).json({ success: false, message });

// Order lines keep the photo from the day of purchase, which may have been deleted since.
// If that photo is no longer on the product, swap in the current photo for the same product
// and color. Accepts one order or a list, and returns plain objects with the fixed images.
const withCurrentImages = async (orders) => {
    const list = Array.isArray(orders) ? orders : [orders];
    const ids = [...new Set(list.flatMap((o) => o.orderItems.map((i) => String(i.product))))];
    const products = await Product.find({ _id: { $in: ids } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const fixed = list.map((order) => {
        const plain = order.toObject();
        plain.orderItems = plain.orderItems.map((item) => {
            const product = productMap.get(String(item.product));
            if (!product) return item; // product was deleted entirely: keep the old photo

            const stillThere = getColorImages(product, item.color).some((img) => img.url === item.image);
            if (stillThere) return item;

            return { ...item, image: getColorImageUrl(product, item.color) || item.image };
        });
        return plain;
    });

    return Array.isArray(orders) ? fixed : fixed[0];
};

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

// How many of a requested line can be bought right now (0 if the product or variant is gone)
const getAvailable = (product, line) => {
    const variant = product?.variants.find((v) => v.size === line.size && v.color === line.color);
    return !product || product.isActive === false || !variant ? 0 : variant.stock;
};

// POST /api/v1/cart/stock-check   (open to guests: it only reads stock)
// Tells the cart page which lines can't be bought as they are
exports.checkCartStock = async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items)) return fail(res, 400, 'Your cart is invalid');

    // Same merging as newOrder, but unusable lines are skipped instead of rejected
    const lines = new Map();
    for (const item of items.slice(0, 100)) {
        const quantity = Number(item?.quantity);
        if (
            !mongoose.isValidObjectId(item?.product) ||
            typeof item.size !== 'string' ||
            typeof item.color !== 'string' ||
            !Number.isInteger(quantity) ||
            quantity < 1
        ) {
            continue;
        }
        const key = `${item.product}|${item.size}|${item.color}`;
        const line = lines.get(key);
        if (line) line.quantity += quantity;
        else lines.set(key, { product: item.product, size: item.size, color: item.color, quantity });
    }
    const requested = [...lines.values()];

    const products = await Product.find({ _id: { $in: requested.map((l) => l.product) } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const stockIssues = [];
    for (const line of requested) {
        const product = productMap.get(String(line.product));
        const available = getAvailable(product, line);
        if (available < line.quantity) {
            stockIssues.push({
                product: String(line.product),
                name: product?.name || 'An item',
                size: line.size,
                color: line.color,
                available,
            });
        }
    }

    return res.status(200).json({ success: true, stockIssues });
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
    const stockIssues = [];
    for (const line of requested) {
        const product = productMap.get(String(line.product));
        const available = getAvailable(product, line);

        if (available < line.quantity) {
            stockIssues.push({
                product: String(line.product),
                name: product?.name || 'An item',
                size: line.size,
                color: line.color,
                available,
            });
            continue;
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

    if (stockIssues.length > 0) {
        return res.status(409).json({
            success: false,
            message: 'Some items in your cart are no longer available',
            stockIssues,
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
    const found = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    const orders = await withCurrentImages(found);

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

    return res.status(200).json({ success: true, order: await withCurrentImages(order) });
};

// GET /api/v1/admin/orders
exports.allOrders = async (req, res) => {
    const found = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    const orders = await withCurrentImages(found);

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

// The number on the Orders badge in the admin sidebar: orders still waiting for the admin
exports.processingCount = async (req, res) => {
    const count = await Order.countDocuments({ orderStatus: 'Processing' });
    return res.status(200).json({ success: true, count });
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

    // The same-length period right before this one, for the "vs previous period" change
    const periodMs = endExclusive - start;
    const previousRange = { createdAt: { $gte: new Date(start.getTime() - periodMs), $lt: start } };

    const summarize = (match) =>
        Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    orders: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$orderStatus', 'Delivered'] }, 1, 0] } },
                    cancelled: { $sum: { $cond: [{ $eq: ['$orderStatus', 'Cancelled'] }, 1, 0] } },
                    sales: { $sum: { $cond: [{ $ne: ['$orderStatus', 'Cancelled'] }, '$totalPrice', 0] } },
                },
            },
        ]);

    const [
        totals,
        previousTotals,
        salesOverTime,
        productSales,
        customerSales,
        recentOrders,
        totalProducts,
        totalUsers,
    ] = await Promise.all([
        summarize(inRange),
        summarize(previousRange),
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
                    _id: '$orderItems.product',
                    name: { $first: '$orderItems.name' },
                    image: { $first: '$orderItems.image' },
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
        Order.find(inRange).sort({ createdAt: -1 }).limit(5).populate('user', 'name').lean(),
        Product.countDocuments(),
        User.countDocuments(),
    ]);

    // Order lines keep the photo from the day of purchase, which may have been deleted since.
    // Prefer the product's current cover photo.
    const currentProducts = await Product.find({ _id: { $in: productSales.map((p) => p._id) } });
    const coverById = new Map(currentProducts.map((p) => [String(p._id), p.coverImage]));

    const empty = { orders: 0, completed: 0, cancelled: 0, sales: 0 };
    const current = totals[0] || empty;
    const previous = previousTotals[0] || empty;

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
        totalOrders: current.orders,
        completedOrders: current.completed,
        cancelledOrders: current.cancelled,
        previous: {
            totalSales: previous.sales,
            totalOrders: previous.orders,
            completedOrders: previous.completed,
            cancelledOrders: previous.cancelled,
        },
        totalSales,
        averageOrderValue: paidOrders ? totalSales / paidOrders : 0,
        totalProducts,
        totalUsers,
        salesOverTime: series,
        productSales: productSales.map((p) => ({
            name: p.name,
            image: coverById.get(String(p._id)) || p.image,
            unitsSold: p.unitsSold,
            total: p.total,
        })),
        recentOrders: recentOrders.map((o) => ({
            _id: o._id,
            orderId: shortOrderId(o._id),
            customer: o.user?.name || 'Deleted user',
            item:
                o.orderItems.length > 1
                    ? `${o.orderItems[0].name} +${o.orderItems.length - 1} more`
                    : o.orderItems[0]?.name || '',
            createdAt: o.createdAt,
            totalPrice: o.totalPrice,
            status: o.orderStatus,
        })),
        customerSales: customerSales.map((c) => ({ name: c.name, orders: c.orders, total: c.total })),
    });
};
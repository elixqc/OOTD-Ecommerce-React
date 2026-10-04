const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const { buildReceiptPdf } = require('../utils/receipt');
const { sendOrderStatusEmail } = require('../utils/email');
const { shortOrderId } = require('../utils/orderFormat');
const { getColorImageUrl } = require('../utils/productImages');

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

// Takes stock from one size/color variant, but only if enough is left.
// The check and the deduction happen in one database operation, so two
// customers can't both buy the last item.
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

    if (requested.some((l) => l.quantity > MAX_QUANTITY_PER_ITEM)) {
        return fail(res, 400, `You can order up to ${MAX_QUANTITY_PER_ITEM} of the same item`);
    }

    const products = await Product.find({ _id: { $in: requested.map((l) => l.product) } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    // Build the order lines from the database and do a first stock check
    const builtItems = [];
    for (const line of requested) {
        const product = productMap.get(String(line.product));
        if (!product) return fail(res, 400, 'A product in your cart is no longer available');

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
            paymentMethod: 'Cash on Delivery',
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

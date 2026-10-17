const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');
const Review = require('../models/review');
const { maskBadWords } = require('../utils/profanity');

const fail = (res, status, message) => res.status(status).json({ success: false, message });

// Checks the rating (whole number 1-5) and the optional comment. Returns { error } or { rating, comment }.
const readReviewInput = (body) => {
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return { error: 'Please choose a rating from 1 to 5 stars' };
    }

    if (body.comment !== undefined && body.comment !== null && typeof body.comment !== 'string') {
        return { error: 'Invalid review text' };
    }
    const comment = (body.comment || '').trim();
    if (comment && comment.length < 3) {
        return { error: 'Write at least 3 characters, or leave the review empty' };
    }
    if (comment.length > 1000) {
        return { error: 'Review cannot exceed 1000 characters' };
    }

    // The original text is saved, so the author sees it again when editing.
    // Bad words are masked when reviews are sent to other people (see maskedComment).
    return { rating, comment };
};

// For lists shown to other people: bad words become ****
const maskedComment = (review) => ({ ...review, comment: maskBadWords(review.comment) });

// For the admin list: the masked comment as usual, plus the original text and a flag
// saying whether anything was masked. Only used on the admin-only route.
const withOriginal = (review) => {
    const masked = maskBadWords(review.comment);
    return { ...review, comment: masked, originalComment: review.comment, flagged: masked !== review.comment };
};

// Recalculates the product's average rating and review count from its reviews
const refreshProductRating = async (productId) => {
    const [stats] = await Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
        { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    await Product.updateOne(
        { _id: productId },
        {
            ratings: stats ? Math.round(stats.average * 10) / 10 : 0,
            numOfReviews: stats ? stats.count : 0,
        }
    );
};

// Only a delivered order counts as a purchase (not cancelled, not still on its way).
// Returns the size and color from the customer's latest delivered order with the product, or null.
const findPurchase = async (userId, productId) => {
    const order = await Order.findOne({ user: userId, orderStatus: 'Delivered', 'orderItems.product': productId })
        .sort({ deliveredAt: -1, createdAt: -1 })
        .select('orderItems')
        .lean();
    if (!order) return null;

    const item = order.orderItems.find((i) => String(i.product) === String(productId));
    return { size: item?.size || '', color: item?.color || '' };
};

const hasText = (review) => Boolean(review.comment && review.comment.trim());
const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));

// GET /api/v1/product/:id/reviews?rating=&withComment=&size=&color=   (public)
// Returns the reviews that match the filters, plus a summary of ALL the product's reviews
// (so the filter buttons can show their counts) and the sizes and colors customers bought.
exports.getProductReviews = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Product not found');

    // The reviewer's id is left out of the public list, and bad words are masked
    const all = await Review.find({ product: req.params.id }).select('-user -__v').sort({ createdAt: -1 }).lean();

    const byStar = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    all.forEach((r) => {
        byStar[r.rating] += 1;
    });
    const summary = {
        total: all.length,
        average: all.length ? Math.round((all.reduce((sum, r) => sum + r.rating, 0) / all.length) * 10) / 10 : 0,
        byStar,
        withComment: all.filter(hasText).length,
    };
    const variantOptions = { sizes: unique(all.map((r) => r.size)), colors: unique(all.map((r) => r.color)) };

    const { rating, withComment, size, color } = req.query;
    const stars = Number(rating);
    const reviews = all.filter(
        (r) =>
            (!Number.isInteger(stars) || stars < 1 || stars > 5 || r.rating === stars) &&
            (withComment !== 'true' || hasText(r)) &&
            (typeof size !== 'string' || !size || r.size === size) &&
            (typeof color !== 'string' || !color || r.color === color)
    );

    return res.status(200).json({
        success: true,
        count: reviews.length,
        reviews: reviews.map(maskedComment),
        summary,
        variantOptions,
    });
};

// GET /api/v1/product/:id/review-status
// Tells the product page whether to show the review form, or the customer's existing review.
// This is the author's own review, so the comment is returned as they wrote it.
exports.getReviewStatus = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Product not found');

    const [review, purchase] = await Promise.all([
        Review.findOne({ product: req.params.id, user: req.user._id }).select('-user -__v'),
        findPurchase(req.user._id, req.params.id),
    ]);

    return res.status(200).json({ success: true, canReview: Boolean(purchase), review });
};

// POST /api/v1/product/:id/review   body: { rating, comment }
exports.createReview = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Product not found');

    const input = readReviewInput(req.body);
    if (input.error) return fail(res, 400, input.error);

    const product = await Product.findById(req.params.id).select('_id');
    if (!product) return fail(res, 404, 'Product not found');

    const purchase = await findPurchase(req.user._id, product._id);
    if (!purchase) {
        return fail(res, 403, 'You can review a product after your order with it has been delivered');
    }

    try {
        const review = await Review.create({
            product: product._id,
            user: req.user._id,
            name: req.user.name,
            rating: input.rating,
            comment: input.comment,
            size: purchase.size,
            color: purchase.color,
        });
        await refreshProductRating(product._id);
        return res.status(201).json({ success: true, review });
    } catch (error) {
        // The unique product + user index stops a second review
        if (error.code === 11000) return fail(res, 409, 'You have already reviewed this product');
        throw error;
    }
};

// PUT /api/v1/review/:id   body: { rating, comment }   (the author only)
exports.updateReview = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Review not found');

    const input = readReviewInput(req.body);
    if (input.error) return fail(res, 400, input.error);

    const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
    if (!review) return fail(res, 404, 'Review not found');

    review.rating = input.rating;
    review.comment = input.comment;

    // Reviews written before sizes and colors were saved get them when edited
    if (!review.size && !review.color) {
        const purchase = await findPurchase(req.user._id, review.product);
        if (purchase) {
            review.size = purchase.size;
            review.color = purchase.color;
        }
    }
    await review.save();
    await refreshProductRating(review.product);

    return res.status(200).json({ success: true, review });
};

// DELETE /api/v1/review/:id   (the author, or an admin)
exports.deleteReview = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Review not found');

    const filter = { _id: req.params.id };
    if (req.user.role !== 'admin') filter.user = req.user._id;

    const review = await Review.findOneAndDelete(filter);
    if (!review) return fail(res, 404, 'Review not found');

    await refreshProductRating(review.product);
    return res.status(200).json({ success: true, message: 'Review deleted' });
};

// GET /api/v1/admin/reviews
exports.getAdminReviews = async (req, res) => {
    const reviews = await Review.find()
        .populate('product', 'name')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .lean();

    return res.status(200).json({ success: true, count: reviews.length, reviews: reviews.map(withOriginal) });
};

// GET /api/v1/reviews/me
// All of the customer's own reviews, so "My orders" can show Write review / Edit review.
// These are the author's own, so comments are returned as written.
exports.getMyReviews = async (req, res) => {
    const reviews = await Review.find({ user: req.user._id }).select('product rating comment');
    return res.status(200).json({ success: true, reviews });
};

// GET /api/v1/reviews/me/details
// The "My reviews" page: every review the customer wrote, newest first, with enough of the
// product (name, price, photos) to show a row. Comments are returned as written (the author's own).
exports.getMyReviewDetails = async (req, res) => {
    const reviews = await Review.find({ user: req.user._id })
        .populate('product', 'name price category images colorImages isActive')
        .sort({ createdAt: -1 })
        .select('-user -__v')
        .lean();

    return res.status(200).json({ success: true, count: reviews.length, reviews });
};
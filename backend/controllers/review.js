const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');
const Review = require('../models/review');
const { maskBadWords } = require('../utils/profanity');

const fail = (res, status, message) => res.status(status).json({ success: false, message });

// Checks the rating (whole number 1-5) and comment. Returns { error } or { rating, comment }.
const readReviewInput = (body) => {
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return { error: 'Please choose a rating from 1 to 5 stars' };
    }

    if (typeof body.comment !== 'string' || body.comment.trim().length < 3) {
        return { error: 'Please write a review (at least 3 characters)' };
    }
    const comment = body.comment.trim();
    if (comment.length > 1000) {
        return { error: 'Review cannot exceed 1000 characters' };
    }

    // The original text is saved, so the author sees it again when editing.
    // Bad words are masked when reviews are sent to other people (see maskedComment).
    return { rating, comment };
};

// For lists shown to other people: bad words become ****
const maskedComment = (review) => ({ ...review, comment: maskBadWords(review.comment) });

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

// Only a delivered order counts as a purchase (not cancelled, not still on its way)
const hasPurchased = (userId, productId) =>
    Order.exists({ user: userId, orderStatus: 'Delivered', 'orderItems.product': productId });

// GET /api/v1/product/:id/reviews   (public)
exports.getProductReviews = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Product not found');

    // The reviewer's id is left out of the public list, and bad words are masked
    const reviews = await Review.find({ product: req.params.id }).select('-user -__v').sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, count: reviews.length, reviews: reviews.map(maskedComment) });
};

// GET /api/v1/product/:id/review-status
// Tells the product page whether to show the review form, or the customer's existing review.
// This is the author's own review, so the comment is returned as they wrote it.
exports.getReviewStatus = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Product not found');

    const [review, purchased] = await Promise.all([
        Review.findOne({ product: req.params.id, user: req.user._id }).select('-user -__v'),
        hasPurchased(req.user._id, req.params.id),
    ]);

    return res.status(200).json({ success: true, canReview: Boolean(purchased), review });
};

// POST /api/v1/product/:id/review   body: { rating, comment }
exports.createReview = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Product not found');

    const input = readReviewInput(req.body);
    if (input.error) return fail(res, 400, input.error);

    const product = await Product.findById(req.params.id).select('_id');
    if (!product) return fail(res, 404, 'Product not found');

    if (!(await hasPurchased(req.user._id, product._id))) {
        return fail(res, 403, 'You can review a product after your order with it has been delivered');
    }

    try {
        const review = await Review.create({
            product: product._id,
            user: req.user._id,
            name: req.user.name,
            rating: input.rating,
            comment: input.comment,
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

    return res.status(200).json({ success: true, count: reviews.length, reviews: reviews.map(maskedComment) });
};

// GET /api/v1/reviews/me
// All of the customer's own reviews, so "My orders" can show Write review / Edit review.
// These are the author's own, so comments are returned as written.
exports.getMyReviews = async (req, res) => {
    const reviews = await Review.find({ user: req.user._id }).select('product rating comment');
    return res.status(200).json({ success: true, reviews });
};
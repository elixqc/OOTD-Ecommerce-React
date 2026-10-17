const mongoose = require('mongoose');
const Product = require('../models/product');
const User = require('../models/user');

const fail = (res, status, message) => res.status(status).json({ success: false, message });

// GET /api/v1/wishlist
// The customer's saved products, newest first. Deleted or deactivated products are left out.
exports.getWishlist = async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: 'wishlist',
        match: { isActive: { $ne: false } },
    });

    const wishlist = [...user.wishlist].reverse();
    res.status(200).json({ success: true, count: wishlist.length, wishlist });
};

// POST /api/v1/wishlist/:productId
// $addToSet means saving the same product twice never creates a duplicate
exports.addToWishlist = async (req, res) => {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) return fail(res, 400, 'Invalid product id');

    const product = await Product.findOne({ _id: productId, isActive: { $ne: false } }).select('_id');
    if (!product) return fail(res, 404, 'Product not found');

    await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: product._id } });
    res.status(200).json({ success: true, message: 'Added to wishlist', productId });
};

// DELETE /api/v1/wishlist/:productId
// Works even if the product was deactivated since it was saved
exports.removeFromWishlist = async (req, res) => {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) return fail(res, 400, 'Invalid product id');

    await User.updateOne({ _id: req.user._id }, { $pull: { wishlist: productId } });
    res.status(200).json({ success: true, message: 'Removed from wishlist', productId });
};
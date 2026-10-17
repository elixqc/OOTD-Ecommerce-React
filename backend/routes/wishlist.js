const express = require('express');
const router = express.Router();

const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/wishlist');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

// Wishlists belong to customers (admins don't shop)
const customerOnly = [isAuthenticatedUser, authorizeRoles('customer')];

router.get('/wishlist', customerOnly, getWishlist);
router.post('/wishlist/:productId', customerOnly, addToWishlist);
router.delete('/wishlist/:productId', customerOnly, removeFromWishlist);

module.exports = router;
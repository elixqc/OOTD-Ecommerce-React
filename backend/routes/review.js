const express = require('express');
const router = express.Router();

const {
    getProductReviews,
    getReviewStatus,
    createReview,
    updateReview,
    deleteReview,
    getAdminReviews,
    getMyReviews,
} = require('../controllers/review');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

router.get('/reviews/me', isAuthenticatedUser, getMyReviews);
router.get('/product/:id/reviews', getProductReviews);
router.get('/product/:id/review-status', isAuthenticatedUser, getReviewStatus);
router.post('/product/:id/review', isAuthenticatedUser, createReview);

router.route('/review/:id').put(isAuthenticatedUser, updateReview).delete(isAuthenticatedUser, deleteReview);

router.get('/admin/reviews', isAuthenticatedUser, authorizeRoles('admin'), getAdminReviews);

module.exports = router;

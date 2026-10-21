// TTL · Transactions + Q2 · Sales chart — order endpoints (cart check, new order, status, stats).
// Public stock-check, customer routes and adminOnly order/status/dashboard routes; mounted under /api/v1.
const express = require('express');
const router = express.Router();

const {
    checkCartStock,
    newOrder,
    myOrders,
    getSingleOrder,
    allOrders,
    updateOrder,
    downloadReceipt,
    dashboardStats,
    processingCount,
} = require('../controllers/order');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const adminOnly = [isAuthenticatedUser, authorizeRoles('admin')];

router.post('/cart/stock-check', checkCartStock);
router.post('/order/new', isAuthenticatedUser, newOrder);
router.get('/orders/me', isAuthenticatedUser, myOrders);
router.get('/order/:id', isAuthenticatedUser, getSingleOrder);
router.get('/order/:id/receipt', isAuthenticatedUser, downloadReceipt);

router.get('/admin/orders', adminOnly, allOrders);
router.get('/admin/orders/processing-count', adminOnly, processingCount);
router.get('/admin/dashboard', adminOnly, dashboardStats);
router.put('/admin/order/:id', adminOnly, updateOrder);

module.exports = router;

const express = require('express');
const router = express.Router();

const {
    newOrder,
    myOrders,
    getSingleOrder,
    allOrders,
    updateOrder,
    deleteOrder,
    downloadReceipt,
} = require('../controllers/order');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const adminOnly = [isAuthenticatedUser, authorizeRoles('admin')];

router.post('/order/new', isAuthenticatedUser, newOrder);
router.get('/orders/me', isAuthenticatedUser, myOrders);
router.get('/order/:id', isAuthenticatedUser, getSingleOrder);
router.get('/order/:id/receipt', isAuthenticatedUser, downloadReceipt);

router.get('/admin/orders', adminOnly, allOrders);
router.route('/admin/order/:id').put(adminOnly, updateOrder).delete(adminOnly, deleteOrder);

module.exports = router;

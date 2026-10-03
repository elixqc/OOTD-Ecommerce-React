const express = require('express');
const router = express.Router();

const {
    newProduct,
    getProducts,
    getSingleProduct,
    getRelatedProducts,
    getAdminProducts,
    updateProduct,
    deleteProduct,
    deleteProducts,
} = require('../controllers/product');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const adminOnly = [isAuthenticatedUser, authorizeRoles('admin')];

router.get('/products', getProducts);
router.get('/product/:id/related', getRelatedProducts);
router.get('/product/:id', getSingleProduct);

router.get('/admin/products', adminOnly, getAdminProducts);
router.post('/admin/product/new', adminOnly, newProduct);
router.delete('/admin/products', adminOnly, deleteProducts);
router
    .route('/admin/product/:id')
    .put(adminOnly, updateProduct)
    .delete(adminOnly, deleteProduct);

module.exports = router;
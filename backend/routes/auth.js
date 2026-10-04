const express = require('express');
const router = express.Router();

const { registerUser, getMe, updateProfile, allUsers, getUserDetails, updateUser } = require('../controllers/auth');
const { verifyToken, isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const adminOnly = [isAuthenticatedUser, authorizeRoles('admin')];

router.post('/register', verifyToken, registerUser);
router.get('/me', isAuthenticatedUser, getMe);
router.put('/me/update', isAuthenticatedUser, updateProfile);

router.get('/admin/users', adminOnly, allUsers);
router.route('/admin/user/:id').get(adminOnly, getUserDetails).put(adminOnly, updateUser);

module.exports = router;
const express = require('express');
const router = express.Router();

const { registerUser, getMe, updateProfile } = require('../controllers/auth');
const { verifyToken, isAuthenticatedUser } = require('../middlewares/auth');

router.post('/register', verifyToken, registerUser);
router.get('/me', isAuthenticatedUser, getMe);
router.put('/me/update', isAuthenticatedUser, updateProfile);

module.exports = router;
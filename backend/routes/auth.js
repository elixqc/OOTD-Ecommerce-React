const express = require('express');
const router = express.Router();

const { registerUser, getMe } = require('../controllers/auth');
const { verifyToken, isAuthenticatedUser } = require('../middlewares/auth');

router.post('/register', verifyToken, registerUser);
router.get('/me', isAuthenticatedUser, getMe);

module.exports = router;
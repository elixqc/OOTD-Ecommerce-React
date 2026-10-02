const express = require('express');
const router = express.Router();

const { registerUser, getMe } = require('../controllers/auth');
const { verifyToken, isAuthenticatedUser } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { registerSchema } = require('../validators/auth');

router.post('/register', verifyToken, validate(registerSchema), registerUser);
router.get('/me', isAuthenticatedUser, getMe);

module.exports = router;
const admin = require('../config/firebase');
const User = require('../models/user');

// Reads "Authorization: Bearer <token>" and verifies it with Firebase
const decodeToken = async (req) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return null;

    try {
        return await admin.auth().verifyIdToken(header.split(' ')[1]);
    } catch (error) {
        return null;
    }
};

// Token only. Used by /register, because the MongoDB user doesn't exist yet.
exports.verifyToken = async (req, res, next) => {
    const decoded = await decodeToken(req);
    if (!decoded) {
        return res.status(401).json({ success: false, message: 'Login first to access this resource' });
    }
    req.firebaseUser = decoded;
    next();
};

// Token + registered MongoDB user + active account
exports.isAuthenticatedUser = async (req, res, next) => {
    const decoded = await decodeToken(req);
    if (!decoded) {
        return res.status(401).json({ success: false, message: 'Login first to access this resource' });
    }

    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
        return res.status(404).json({ success: false, message: 'Account not registered. Please complete registration.' });
    }
    if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'This account has been deactivated' });
    }

    req.user = user;
    next();
};

// Use after isAuthenticatedUser, e.g. authorizeRoles('admin')
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role (${req.user.role}) is not allowed to access this resource`,
            });
        }
        next();
    };
};
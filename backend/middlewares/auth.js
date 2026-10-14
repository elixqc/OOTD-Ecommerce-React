const { getAuth } = require('@clerk/express');
const User = require('../models/user');

// Token only. Used by /register, because the MongoDB user doesn't exist yet.
exports.verifyToken = (req, res, next) => {
    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Login first to access this resource' });
    }
    req.clerkUserId = userId;
    next();
};

// Token + registered MongoDB user + active account
exports.isAuthenticatedUser = async (req, res, next) => {
    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Login first to access this resource' });
    }

    const user = await User.findOne({ clerkId: userId });
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
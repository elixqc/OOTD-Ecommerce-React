const mongoose = require('mongoose');
const firebaseAuth = require('../config/firebase');
const Order = require('../models/order');
const cloudinary = require('../config/cloudinary');
const User = require('../models/user');

// POST /api/v1/register
// Safe to call after every login: returns the existing user if already registered.
exports.registerUser = async (req, res) => {
    const { uid, email, name: tokenName } = req.firebaseUser;

    let user = await User.findOne({ firebaseUid: uid });
    if (user) {
        return res.status(200).json({ success: true, user });
    }

    if (!email) {
        return res.status(400).json({ success: false, message: 'Your account has no email address' });
    }

    const { name, phone, avatar } = req.body;

    let avatarData;
    if (avatar) {
        if (typeof avatar !== 'string' || !avatar.startsWith('data:image/')) {
            return res.status(400).json({ success: false, message: 'Avatar must be an image' });
        }
        if (avatar.length > 3000000) {
            return res.status(400).json({ success: false, message: 'Avatar is too large (max about 2 MB)' });
        }

        const result = await cloudinary.uploader.upload(avatar, {
            folder: 'ootd/avatars',
            width: 300,
            height: 300,
            crop: 'fill',
            gravity: 'face',
        });
        avatarData = { public_id: result.public_id, url: result.secure_url };
    }

    // Mongoose checks name length and required fields
    user = await User.create({
        firebaseUid: uid,
        name: name || tokenName,
        email,
        phone,
        avatar: avatarData,
    });

    return res.status(201).json({ success: true, user });
};

// GET /api/v1/me
exports.getMe = async (req, res) => {
    return res.status(200).json({ success: true, user: req.user });
};

// PUT /api/v1/me/update
// Only name, phone, shipping address, and avatar can be changed here (not role, email, or isActive)
exports.updateProfile = async (req, res) => {
    const { name, phone, shippingAddress, avatar } = req.body;
    const user = req.user;

    const text = (value) => (typeof value === 'string' ? value.trim() : '');

    if (name !== undefined) user.name = text(name);
    if (phone !== undefined) user.phone = text(phone);
    if (shippingAddress && typeof shippingAddress === 'object') {
        user.shippingAddress = {
            address: text(shippingAddress.address),
            city: text(shippingAddress.city),
            postalCode: text(shippingAddress.postalCode),
            country: text(shippingAddress.country),
        };
    }

    // A new photo is uploaded first; the old one is deleted only after the save works
    let newAvatar;
    if (avatar) {
        if (typeof avatar !== 'string' || !avatar.startsWith('data:image/')) {
            return res.status(400).json({ success: false, message: 'Avatar must be an image' });
        }
        if (avatar.length > 3000000) {
            return res.status(400).json({ success: false, message: 'Avatar is too large (max about 2 MB)' });
        }

        const result = await cloudinary.uploader.upload(avatar, {
            folder: 'ootd/avatars',
            width: 300,
            height: 300,
            crop: 'fill',
            gravity: 'face',
        });
        newAvatar = { public_id: result.public_id, url: result.secure_url };
    }

    const oldAvatarId = user.avatar?.public_id;
    if (newAvatar) user.avatar = newAvatar;

    try {
        await user.save(); // Mongoose checks name, phone, and address
    } catch (error) {
        if (newAvatar) {
            await cloudinary.uploader.destroy(newAvatar.public_id).catch(() => {});
        }
        throw error;
    }

    if (newAvatar && oldAvatarId) {
        await cloudinary.uploader
            .destroy(oldAvatarId)
            .catch((err) => console.error('Cloudinary delete failed:', oldAvatarId, err.message));
    }

    return res.status(200).json({ success: true, user });
};

const userNotFound = (res) => res.status(404).json({ success: false, message: 'User not found' });

// GET /api/v1/admin/users
exports.allUsers = async (req, res) => {
    const users = await User.find().select('-firebaseUid -wishlist').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: users.length, users });
};

// GET /api/v1/admin/user/:id
exports.getUserDetails = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return userNotFound(res);

    const user = await User.findById(req.params.id).select('-firebaseUid -wishlist');
    if (!user) return userNotFound(res);

    const orderCount = await Order.countDocuments({ user: user._id });
    return res.status(200).json({ success: true, user, orderCount });
};

// PUT /api/v1/admin/user/:id   body: { isActive: true | false }
// Only the active status can be changed here, not the role, email, or name.
exports.updateUser = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return userNotFound(res);

    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ success: false, message: 'isActive must be true or false' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return userNotFound(res);

    if (user.role === 'admin') {
        return res.status(400).json({ success: false, message: "Admin accounts can't be deactivated here" });
    }
    if (user.isActive === isActive) {
        return res.status(200).json({ success: true, user });
    }

    // Firebase first: a disabled account can't log in, and its sessions are revoked
    try {
        await firebaseAuth.updateUser(user.firebaseUid, { disabled: !isActive });
        if (!isActive) await firebaseAuth.revokeRefreshTokens(user.firebaseUid);
    } catch (error) {
        if (error.code !== 'auth/user-not-found') throw error;
    }

    user.isActive = isActive;
    try {
        await user.save();
    } catch (error) {
        // Keep Firebase and the database in sync
        await firebaseAuth.updateUser(user.firebaseUid, { disabled: isActive }).catch(() => {});
        throw error;
    }

    return res.status(200).json({ success: true, user });
};
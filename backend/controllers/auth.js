const mongoose = require('mongoose');
const { clerkClient } = require('@clerk/express');
const Order = require('../models/order');
const cloudinary = require('../config/cloudinary');
const User = require('../models/user');

// POST /api/v1/register
// Safe to call after every login: returns the existing user if already registered.
exports.registerUser = async (req, res) => {
    const clerkId = req.clerkUserId;

    let user = await User.findOne({ clerkId });
    if (user) {
        return res.status(200).json({ success: true, user });
    }

    const clerkUser = await clerkClient.users.getUser(clerkId);
    const email = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Your account has no email address' });
    }

    // Old account from before Clerk (same email): link it instead of making a duplicate
    user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
        user.clerkId = clerkId;
        await user.save();
        return res.status(200).json({ success: true, user });
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
        clerkId,
        name: name || clerkUser.fullName || email.split('@')[0],
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
            region: text(shippingAddress.region),
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
    const [found, orderStats] = await Promise.all([
        User.find().select('-clerkId -wishlist').sort({ createdAt: -1 }).lean(),
        // Orders and money spent per user. Cancelled orders don't count as spent.
        Order.aggregate([
            {
                $group: {
                    _id: '$user',
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: { $cond: [{ $ne: ['$orderStatus', 'Cancelled'] }, '$totalPrice', 0] } },
                },
            },
        ]),
    ]);

    const statsById = new Map(orderStats.map((s) => [String(s._id), s]));
    const users = found.map((u) => {
        const stats = statsById.get(String(u._id));
        return { ...u, orderCount: stats?.orderCount || 0, totalSpent: stats?.totalSpent || 0 };
    });

    return res.status(200).json({ success: true, count: users.length, users });
};

// GET /api/v1/admin/user/:id
exports.getUserDetails = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return userNotFound(res);

    const user = await User.findById(req.params.id).select('-clerkId -wishlist');
    if (!user) return userNotFound(res);

    const [orderStats, recentOrders] = await Promise.all([
        Order.aggregate([
            { $match: { user: user._id } },
            {
                $group: {
                    _id: null,
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: { $cond: [{ $ne: ['$orderStatus', 'Cancelled'] }, '$totalPrice', 0] } },
                },
            },
        ]),
        Order.find({ user: user._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('orderItems.name totalPrice orderStatus createdAt')
            .lean(),
    ]);

    const { orderCount = 0, totalSpent = 0 } = orderStats[0] || {};
    return res.status(200).json({ success: true, user, orderCount, totalSpent, recentOrders });
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

    // Clerk first: a banned account can't sign in, and its sessions are revoked
    try {
        if (isActive) await clerkClient.users.unbanUser(user.clerkId);
        else await clerkClient.users.banUser(user.clerkId);
    } catch (error) {
        if (error.status !== 404) throw error;
    }

    user.isActive = isActive;
    try {
        await user.save();
    } catch (error) {
        // Keep Clerk and the database in sync
        const undo = isActive ? clerkClient.users.banUser : clerkClient.users.unbanUser;
        await undo.call(clerkClient.users, user.clerkId).catch(() => {});
        throw error;
    }

    return res.status(200).json({ success: true, user });
};
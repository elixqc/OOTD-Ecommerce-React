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
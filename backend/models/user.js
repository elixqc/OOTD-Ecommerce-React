const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: [true, 'Please enter your name'],
            trim: true,
            minLength: [2, 'Name must be at least 2 characters'],
            maxLength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
            maxLength: [20, 'Phone number is too long'],
            default: '',
        },
        shippingAddress: {
            address: { type: String, default: '' },
            city: { type: String, default: '' },
            postalCode: { type: String, default: '' },
            country: { type: String, default: '' },
        },
        avatar: {
            public_id: { type: String, default: '' },
            url: { type: String, default: '' },
        },
        role: {
            type: String,
            enum: ['customer', 'admin'],
            default: 'customer',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
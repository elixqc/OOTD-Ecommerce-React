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
            match: [/^[0-9+\-\s()]{7,15}$/, 'Enter a valid phone number'],
            default: '',
        },
        shippingAddress: {
            address: { type: String, trim: true, maxLength: [200, 'Address is too long'], default: '' },
            city: { type: String, trim: true, maxLength: [60, 'City is too long'], default: '' },
            postalCode: { type: String, trim: true, maxLength: [10, 'Postal code is too long'], default: '' },
            country: { type: String, trim: true, maxLength: [60, 'Country is too long'], default: '' },
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
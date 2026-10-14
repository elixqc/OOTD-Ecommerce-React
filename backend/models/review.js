const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            required: [true, 'Please provide a rating'],
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
        },
        // The comment is optional, so a customer can leave a star rating only
        comment: {
            type: String,
            trim: true,
            default: '',
            maxLength: [1000, 'Review cannot exceed 1000 characters'],
        },
        // The size and color the customer bought (copied from their delivered order)
        size: { type: String, trim: true, default: '' },
        color: { type: String, trim: true, default: '' },
    },
    { timestamps: true }
);

// One review per customer per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
const mongoose = require('mongoose');
const { CATEGORIES, GENDERS } = require('../utils/constants');

const variantSchema = new mongoose.Schema({
    size: {
        type: String,
        required: [true, 'Variant size is required'],
        trim: true,
    },
    color: {
        type: String,
        required: [true, 'Variant color is required'],
        trim: true,
    },
    stock: {
        type: Number,
        required: [true, 'Variant stock is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0,
    },
});

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please enter product name'],
            trim: true,
            maxLength: [100, 'Product name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            required: [true, 'Please enter product description'],
        },
        price: {
            type: Number,
            required: [true, 'Please enter product price'],
            min: [0, 'Price cannot be negative'],
            default: 0,
        },
        category: {
            type: String,
            required: [true, 'Please select a category'],
            enum: {
                values: CATEGORIES,
                message: 'Please select a valid category',
            },
        },
        brand: {
            type: String,
            trim: true,
            default: '',
        },
        gender: {
            type: String,
            enum: {
                values: GENDERS,
                message: 'Please select a valid gender',
            },
            default: 'Unisex',
        },
        material: {
            type: String,
            trim: true,
            default: '',
        },
        images: {
            type: [
                {
                    public_id: { type: String, required: true },
                    url: { type: String, required: true },
                },
            ],
            validate: [(arr) => arr.length > 0, 'Please add at least one product image'],
        },
        variants: {
            type: [variantSchema],
            validate: [(arr) => arr.length > 0, 'Please add at least one size/color variant'],
        },
        ratings: {
            type: Number,
            default: 0,
        },
        numOfReviews: {
            type: Number,
            default: 0,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

productSchema.virtual('totalStock').get(function () {
    return this.variants.reduce((sum, v) => sum + v.stock, 0);
});

module.exports = mongoose.model('Product', productSchema);
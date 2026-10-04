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

const imageSchema = new mongoose.Schema(
    {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
    },
    { _id: false }
);

// One gallery per color. The first image is the main one.
const colorImagesSchema = new mongoose.Schema(
    {
        color: {
            type: String,
            required: [true, 'Color name is required'],
            trim: true,
        },
        images: { type: [imageSchema], default: [] },
    },
    { _id: false }
);

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
        // Shared photos from before per-color galleries. Only used as a fallback
        // for colors that have no photos of their own.
        images: { type: [imageSchema], default: [] },
        colorImages: { type: [colorImagesSchema], default: [] },
        variants: {
            type: [variantSchema],
            validate: [
                {
                    validator: (arr) => arr.length > 0,
                    message: 'Please add at least one size/color variant',
                },
                {
                    validator: (arr) =>
                        new Set(
                            arr.map((v) => `${String(v.size || '').toLowerCase()}|${String(v.color || '').toLowerCase()}`)
                        ).size === arr.length,
                    message: 'Each size and color combination can only appear once',
                },
            ],
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

// Every color must have its own photos, unless the product still has legacy shared photos
productSchema.pre('validate', function () {
    const hasFallback = this.images.length > 0;
    const colors = [...new Set(this.variants.map((v) => String(v.color || '').trim().toLowerCase()))];

    colors.forEach((key) => {
        const gallery = this.colorImages.find((c) => c.color.trim().toLowerCase() === key);
        if (!hasFallback && (!gallery || gallery.images.length === 0)) {
            const name = this.variants.find((v) => String(v.color).trim().toLowerCase() === key).color;
            this.invalidate('colorImages', `Please add at least one image for ${name}`);
        }
    });
});

// Main image for cards and lists: first color's first photo
productSchema.virtual('coverImage').get(function () {
    const gallery = this.colorImages.find((c) => c.images.length > 0);
    return gallery ? gallery.images[0].url : this.images[0]?.url || '';
});

module.exports = mongoose.model('Product', productSchema);
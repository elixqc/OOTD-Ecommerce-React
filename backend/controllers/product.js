const cloudinary = require('../config/cloudinary');
const Product = require('../models/product');
const Review = require('../models/review');
const User = require('../models/user');

const MAX_IMAGES = 5;
const MAX_IMAGE_LENGTH = 4000000;
const PRODUCT_FIELDS = ['name', 'description', 'price', 'category', 'brand', 'gender', 'material', 'variants'];

// Only these fields can be set from the request, so a client can't send ratings, user, etc.
const pickProductFields = (body) => {
    const data = {};
    PRODUCT_FIELDS.forEach((field) => {
        if (body[field] !== undefined) data[field] = body[field];
    });
    return data;
};

// Returns an error message, or null if the images are fine
const checkImages = (list) => {
    if (!Array.isArray(list)) return 'Images must be sent as a list';
    if (list.length > MAX_IMAGES) return `You can upload up to ${MAX_IMAGES} images`;

    const invalid = list.some(
        (img) =>
            typeof img !== 'string' ||
            !(img.startsWith('data:image/') || img.startsWith('https://')) ||
            img.length > MAX_IMAGE_LENGTH
    );
    if (invalid) return 'Each image must be an image file (max about 3 MB) or an https link';

    return null;
};

const deleteImages = async (publicIds) => {
    await Promise.all(
        publicIds.map((id) =>
            cloudinary.uploader.destroy(id).catch((err) => console.error('Cloudinary delete failed:', id, err.message))
        )
    );
};

// Uploads all images; if one fails, removes the ones already uploaded
const uploadImages = async (images) => {
    const uploaded = [];
    try {
        for (const image of images) {
            const result = await cloudinary.uploader.upload(image, {
                folder: 'ootd/products',
                width: 1000,
                height: 1000,
                crop: 'limit',
            });
            uploaded.push({ public_id: result.public_id, url: result.secure_url });
        }
    } catch (error) {
        await deleteImages(uploaded.map((i) => i.public_id));
        throw error;
    }
    return uploaded;
};

// Removes the products' reviews and wishlist entries
const cleanupProducts = async (productIds) => {
    await Review.deleteMany({ product: { $in: productIds } });
    await User.updateMany({}, { $pull: { wishlist: { $in: productIds } } });
};

// POST /api/v1/admin/product/new
exports.newProduct = async (req, res) => {
    const newImages = req.body.newImages || [];

    const imageError = checkImages(newImages);
    if (imageError) {
        return res.status(400).json({ success: false, message: imageError });
    }
    if (newImages.length === 0) {
        return res.status(400).json({ success: false, message: 'Please add at least one product image' });
    }

    const images = await uploadImages(newImages);

    try {
        const product = await Product.create({
            ...pickProductFields(req.body),
            images,
            user: req.user._id,
        });
        return res.status(201).json({ success: true, product });
    } catch (error) {
        await deleteImages(images.map((i) => i.public_id));
        throw error;
    }
};

// GET /api/v1/product/:id  (public)
exports.getSingleProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(200).json({ success: true, product });
};

// GET /api/v1/admin/products
exports.getAdminProducts = async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: products.length, products });
};

// PUT /api/v1/admin/product/:id
exports.updateProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const newImages = req.body.newImages || [];
    const keepImageIds = Array.isArray(req.body.keepImageIds) ? req.body.keepImageIds : [];

    const imageError = checkImages(newImages);
    if (imageError) {
        return res.status(400).json({ success: false, message: imageError });
    }

    const keptImages = product.images
        .filter((img) => keepImageIds.includes(img.public_id))
        .map((img) => ({ public_id: img.public_id, url: img.url }));
    const removedImages = product.images.filter((img) => !keepImageIds.includes(img.public_id));

    const totalImages = keptImages.length + newImages.length;
    if (totalImages === 0) {
        return res.status(400).json({ success: false, message: 'A product needs at least one image' });
    }
    if (totalImages > MAX_IMAGES) {
        return res.status(400).json({ success: false, message: `A product can have up to ${MAX_IMAGES} images` });
    }

    const uploaded = await uploadImages(newImages);

    product.set({ ...pickProductFields(req.body), images: [...keptImages, ...uploaded] });

    try {
        await product.save();
    } catch (error) {
        await deleteImages(uploaded.map((i) => i.public_id));
        throw error;
    }

    await deleteImages(removedImages.map((i) => i.public_id));

    return res.status(200).json({ success: true, product });
};

// DELETE /api/v1/admin/product/:id
exports.deleteProduct = async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await deleteImages(product.images.map((i) => i.public_id));
    await cleanupProducts([product._id]);

    return res.status(200).json({ success: true, message: 'Product deleted' });
};

// DELETE /api/v1/admin/products   body: { "ids": ["...", "..."] }
exports.deleteProducts = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Select at least one product' });
    }

    const products = await Product.find({ _id: { $in: ids } });
    if (products.length === 0) {
        return res.status(404).json({ success: false, message: 'No matching products found' });
    }

    const productIds = products.map((p) => p._id);
    await Product.deleteMany({ _id: { $in: productIds } });

    const publicIds = products.flatMap((p) => p.images.map((i) => i.public_id));
    await deleteImages(publicIds);
    await cleanupProducts(productIds);

    return res.status(200).json({ success: true, deletedCount: products.length });
};
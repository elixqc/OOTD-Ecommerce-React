const cloudinary = require('../config/cloudinary');
const Product = require('../models/product');
const Review = require('../models/review');
const User = require('../models/user');
const { CATEGORIES, MAX_IMAGES_PER_COLOR, IMAGE_FOLDER } = require('../utils/constants');

const MAX_IMAGE_LENGTH = 4000000; // base64 characters, roughly 3 MB of image
const ALLOWED_TYPES = /^data:image\/(jpeg|png|webp);base64,/;
const PRODUCT_FIELDS = ['name', 'description', 'price', 'category', 'brand', 'gender', 'material', 'variants'];

// Only these fields can be set from the request, so a client can't send ratings, user, etc.
const pickProductFields = (body) => {
    const data = {};
    PRODUCT_FIELDS.forEach((field) => {
        if (body[field] !== undefined) data[field] = body[field];
    });
    return data;
};

const deleteImages = async (publicIds) => {
    await Promise.all(
        publicIds.map((id) =>
            cloudinary.uploader.destroy(id).catch((err) => console.error('Cloudinary delete failed:', id, err.message))
        )
    );
};

// A public_id is only accepted if it lives in our products folder
const isProductImage = (img) =>
    img &&
    typeof img.public_id === 'string' &&
    img.public_id.startsWith(`${IMAGE_FOLDER}/`) &&
    typeof img.url === 'string' &&
    img.url.startsWith('https://');

// Builds one gallery per color from what the admin sent.
// Returns { colorImages } or { error }.
const buildColorImages = (variants, sent) => {
    if (!Array.isArray(variants) || variants.length === 0) return { error: 'Please add at least one size/color variant' };
    if (!Array.isArray(sent)) return { error: 'Color images must be sent as a list' };

    const colorImages = [];
    const seen = new Set();

    for (const variant of variants) {
        const name = String(variant?.color || '').trim();
        const key = name.toLowerCase();
        if (!name || seen.has(key)) continue;
        seen.add(key);

        const entry = sent.find((c) => String(c?.color || '').trim().toLowerCase() === key);
        const images = Array.isArray(entry?.images) ? entry.images : [];

        if (images.length > MAX_IMAGES_PER_COLOR) {
            return { error: `${name} can have up to ${MAX_IMAGES_PER_COLOR} images` };
        }
        if (!images.every(isProductImage)) return { error: `Invalid image for ${name}` };

        colorImages.push({ color: name, images: images.map(({ public_id, url }) => ({ public_id, url })) });
    }
    return { colorImages };
};

const collectIds = (colorImages = []) => colorImages.flatMap((c) => c.images.map((i) => i?.public_id));

// POST /api/v1/admin/product/image   body: { image: "data:image/...;base64,..." }
// Uploads one image right away so the form can show progress. The product only
// stores the returned { public_id, url } when it is saved.
exports.uploadProductImage = async (req, res) => {
    const { image } = req.body;

    if (typeof image !== 'string' || !ALLOWED_TYPES.test(image)) {
        return res.status(400).json({ success: false, message: 'Only JPG, PNG or WebP images are allowed' });
    }
    if (image.length > MAX_IMAGE_LENGTH) {
        return res.status(400).json({ success: false, message: 'Image is too large (max about 3 MB)' });
    }

    const result = await cloudinary.uploader.upload(image, {
        folder: IMAGE_FOLDER,
        width: 1200,
        height: 1200,
        crop: 'limit',
    });
    return res.status(201).json({ success: true, image: { public_id: result.public_id, url: result.secure_url } });
};

// DELETE /api/v1/admin/product/image   body: { public_id }
// Removes an upload the admin abandoned. Images that belong to a product are never deleted here.
exports.removeUploadedImage = async (req, res) => {
    const { public_id } = req.body;

    if (typeof public_id !== 'string' || !public_id.startsWith(`${IMAGE_FOLDER}/`)) {
        return res.status(400).json({ success: false, message: 'Invalid image' });
    }

    const inUse = await Product.exists({
        $or: [{ 'colorImages.images.public_id': public_id }, { 'images.public_id': public_id }],
    });
    if (inUse) {
        return res.status(200).json({ success: true, deleted: false });
    }

    await deleteImages([public_id]);
    return res.status(200).json({ success: true, deleted: true });
};

// Removes the products' reviews and wishlist entries
const cleanupProducts = async (productIds) => {
    await Review.deleteMany({ product: { $in: productIds } });
    await User.updateMany({}, { $pull: { wishlist: { $in: productIds } } });
};

// POST /api/v1/admin/product/new
exports.newProduct = async (req, res) => {
    const { colorImages, error } = buildColorImages(req.body.variants, req.body.colorImages);
    if (error) {
        return res.status(400).json({ success: false, message: error });
    }

    const product = await Product.create({
        ...pickProductFields(req.body),
        colorImages,
        user: req.user._id,
    });

    // Images that were uploaded but belong to a color that was dropped
    const submitted = Array.isArray(req.body.colorImages) ? collectIds(req.body.colorImages.filter((c) => Array.isArray(c?.images))) : [];
    const used = new Set(collectIds(product.colorImages));
    await deleteImages(submitted.filter((id) => !used.has(id) && typeof id === 'string' && id.startsWith(`${IMAGE_FOLDER}/`)));

    return res.status(201).json({ success: true, product });
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

    const variants = req.body.variants !== undefined ? req.body.variants : product.variants;
    const { colorImages, error } = buildColorImages(variants, req.body.colorImages);
    if (error) {
        return res.status(400).json({ success: false, message: error });
    }

    const before = [...collectIds(product.colorImages), ...product.images.map((i) => i.public_id)];
    const submitted = Array.isArray(req.body.colorImages) ? collectIds(req.body.colorImages.filter((c) => Array.isArray(c?.images))) : [];

    product.set({ ...pickProductFields(req.body), colorImages });

    // Legacy shared photos are only kept while some color still has no photos of its own
    const everyColorHasImages = colorImages.every((c) => c.images.length > 0);
    if (everyColorHasImages) product.images = [];

    await product.save();

    // Delete what is no longer used: photos the admin removed, dropped colors, and old shared photos
    const used = new Set([...collectIds(product.colorImages), ...product.images.map((i) => i.public_id)]);
    const leftovers = [...new Set([...before, ...submitted])].filter(
        (id) => !used.has(id) && typeof id === 'string' && id.startsWith(`${IMAGE_FOLDER}/`)
    );
    await deleteImages(leftovers);

    return res.status(200).json({ success: true, product });
};

// DELETE /api/v1/admin/product/:id
exports.deleteProduct = async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await deleteImages([...product.images.map((i) => i.public_id), ...collectIds(product.colorImages)]);
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

    const publicIds = products.flatMap((p) => [...p.images.map((i) => i.public_id), ...collectIds(p.colorImages)]);
    await deleteImages(publicIds);
    await cleanupProducts(productIds);

    return res.status(200).json({ success: true, deletedCount: products.length });
};

// Escapes regex characters so a keyword like "(" can't break the search
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toNumber = (value) => (value === undefined || value === '' || Array.isArray(value) ? NaN : Number(value));

// GET /api/v1/products?keyword=&category=&minPrice=&maxPrice=&rating=&page=&limit=   (public)
exports.getProducts = async (req, res) => {
    const { keyword, category, minPrice, maxPrice, rating } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 24);

    const filter = {};

    if (typeof keyword === 'string' && keyword.trim()) {
        const pattern = new RegExp(escapeRegex(keyword.trim()), 'i');
        filter.$or = [{ name: pattern }, { category: pattern }, { brand: pattern }];
    }

    if (CATEGORIES.includes(category)) {
        filter.category = category;
    }

    const min = toNumber(minPrice);
    const max = toNumber(maxPrice);
    if (Number.isFinite(min) || Number.isFinite(max)) {
        filter.price = {};
        if (Number.isFinite(min)) filter.price.$gte = min;
        if (Number.isFinite(max)) filter.price.$lte = max;
    }

    const minRating = toNumber(rating);
    if (Number.isFinite(minRating) && minRating > 0) {
        filter.ratings = { $gte: minRating };
    }

    // Count before skip/limit, so total is the real number of matches
    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
        .select('-user')
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    return res.status(200).json({
        success: true,
        products,
        total,
        page,
        hasMore: page * limit < total,
    });
};

// GET /api/v1/product/:id/related   (public)
// Other products in the same category, best rated first
exports.getRelatedProducts = async (req, res) => {
    const product = await Product.findById(req.params.id).select('category');
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const products = await Product.find({ category: product.category, _id: { $ne: product._id } })
        .select('-user')
        .sort({ ratings: -1, createdAt: -1 })
        .limit(4);

    return res.status(200).json({ success: true, products });
};
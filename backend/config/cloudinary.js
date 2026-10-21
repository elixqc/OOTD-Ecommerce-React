// MP1 · Product CRUD — Cloudinary SDK setup for product photo uploads.
// Holds cloud name/key/secret; the product controller streams images here and stores the returned URL.
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;

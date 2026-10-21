// MP1 · Product CRUD — normalises a product's color/image data for responses.
// Used by controllers/product.js so cards and checkout always get a consistent images array.
const sameColor = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

// All photos for one color. Falls back to the shared (legacy) photos.
exports.getColorImages = (product, color) => {
    const gallery = product.colorImages.find((c) => sameColor(c.color, color));
    return gallery && gallery.images.length > 0 ? gallery.images : product.images;
};

exports.getColorImageUrl = (product, color) =>
    exports.getColorImages(product, color)[0]?.url || product.coverImage;

exports.sameColor = sameColor;

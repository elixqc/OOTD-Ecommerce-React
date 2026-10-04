const sameColor = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

// Photos for one color. Older products only have shared photos, so fall back to those.
export const getColorImages = (product, color) => {
    const gallery = product.colorImages?.find((c) => sameColor(c.color, color));
    return gallery?.images?.length ? gallery.images : product.images || [];
};

export const getColorImageUrl = (product, color) => getColorImages(product, color)[0]?.url || product.coverImage || '';

// Every color on the product, in the order the admin entered them
export const getColors = (product) => {
    const seen = new Set();
    return product.variants
        .map((v) => v.color.trim())
        .filter((name) => {
            const key = name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
};

// The two photos a catalog card shows: the cover, and the next photo of the same color for hover
export const getCardImages = (product) => {
    const gallery = product.colorImages?.find((c) => c.images?.length);
    const photos = gallery ? gallery.images : product.images || [];
    return { cover: photos[0]?.url || product.coverImage || '', hover: photos[1]?.url || '' };
};

export { sameColor };
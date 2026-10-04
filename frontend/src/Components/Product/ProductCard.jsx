import { Link } from 'react-router-dom';
import { Rating } from '@mui/material';

const NEW_FOR_DAYS = 30;

// Products added in the last 30 days get the "New Arrivals" pill
const isNew = (createdAt) => (new Date() - new Date(createdAt)) / 86400000 <= NEW_FOR_DAYS;

export default function ProductCard({ product }) {
    let badge = null;
    if (product.totalStock === 0) badge = 'Sold out';
    else if (isNew(product.createdAt)) badge = 'New Arrivals';

    // Photos of the first color (older products use their shared photos).
    // The first photo is the main one and the second shows on hover.
    const gallery = product.colorImages?.find((c) => c.images?.length);
    const photos = gallery ? gallery.images : product.images || [];
    const mainImage = photos[0]?.url || product.coverImage;
    const hoverImage = photos[1]?.url;

    return (
        <Link to={`/product/${product._id}`} className={hoverImage ? 'product-card has-hover' : 'product-card'}>
            <div className="product-card-media">
                <img src={mainImage} alt={product.name} className="product-card-img-main" loading="lazy" />
                {hoverImage && (
                    <img src={hoverImage} alt="" aria-hidden="true" className="product-card-img-hover" loading="lazy" />
                )}
                {badge && <span className={badge === 'Sold out' ? 'product-badge sold-out' : 'product-badge'}>{badge}</span>}
            </div>

            <div className="product-card-info">
                <span className="product-card-name">{product.name}</span>
                <span className="product-card-price">₱{product.price.toLocaleString()}</span>
                {product.numOfReviews > 0 && <Rating value={product.ratings} precision={0.5} size="small" readOnly />}
            </div>
        </Link>
    );
}
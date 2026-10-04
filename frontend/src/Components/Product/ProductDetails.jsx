import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Button,
    Chip,
    CircularProgress,
    IconButton,
    Rating,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { getProductDetails, getRelatedProducts } from '../../actions/productActions';
import { addToCart } from '../../actions/cartActions';
import { notifyError, notifySuccess } from '../../Utils/helpers';
import ProductCard from './ProductCard';
import ListReviews from '../Review/ListReviews';

// Separate component so the selected image, size, color, and quantity reset whenever the product changes
function ProductInfo({ product }) {
    const dispatch = useDispatch();
    const firstAvailable = product.variants.find((v) => v.stock > 0) || product.variants[0];

    const [activeImage, setActiveImage] = useState(0);
    const [size, setSize] = useState(firstAvailable.size);
    const [color, setColor] = useState(firstAvailable.color);
    const [quantity, setQuantity] = useState(1);

    const sizes = [...new Set(product.variants.map((v) => v.size))];
    const colorOptions = product.variants.filter((v) => v.size === size);
    const selected = product.variants.find((v) => v.size === size && v.color === color);

    const sizeSoldOut = (s) => product.variants.filter((v) => v.size === s).every((v) => v.stock === 0);

    // Keep the color if the new size has it, otherwise pick one that is in stock
    const handleSize = (newSize) => {
        const options = product.variants.filter((v) => v.size === newSize);
        setSize(newSize);
        setQuantity(1);
        if (!options.some((v) => v.color === color)) {
            setColor((options.find((v) => v.stock > 0) || options[0]).color);
        }
    };

    const handleColor = (newColor) => {
        setColor(newColor);
        setQuantity(1);
    };

    const handleAddToCart = () => {
        const message = dispatch(addToCart(product, size, color, quantity));
        if (message) {
            notifyError(message);
        } else {
            notifySuccess('Added to cart');
        }
    };

    const outOfStock = !selected || selected.stock === 0;

    let stockLabel = <Chip label="In stock" size="small" color="success" />;
    if (outOfStock) {
        stockLabel = <Chip label="Out of stock" size="small" color="error" />;
    } else if (selected.stock <= 5) {
        stockLabel = <Chip label={`Only ${selected.stock} left`} size="small" color="warning" />;
    }

    return (
        <div className="product-detail">
            <div className="product-gallery">
                <img src={product.images[activeImage]?.url} alt={product.name} className="product-gallery-main" />
                {product.images.length > 1 && (
                    <div className="product-thumbs">
                        {product.images.map((img, index) => (
                            <img
                                key={img.public_id}
                                src={img.url}
                                alt={`${product.name} ${index + 1}`}
                                className={index === activeImage ? 'product-thumb active' : 'product-thumb'}
                                onClick={() => setActiveImage(index)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="product-info">
                <Typography variant="body2" color="text.secondary">
                    {product.brand || product.category}
                </Typography>
                <Typography variant="h4" component="h1">
                    {product.name}
                </Typography>

                <div className="product-rating">
                    <Rating value={product.ratings} precision={0.5} readOnly />
                    <Typography variant="body2" color="text.secondary">
                        ({product.numOfReviews} review{product.numOfReviews === 1 ? '' : 's'})
                    </Typography>
                </div>

                <Typography variant="h5">₱{product.price.toLocaleString()}</Typography>
                <Typography variant="body1" className="product-description">
                    {product.description}
                </Typography>

                <div className="option-group">
                    <Typography variant="subtitle2">Size</Typography>
                    <ToggleButtonGroup
                        exclusive
                        size="small"
                        sx={{ flexWrap: 'wrap' }}
                        value={size}
                        onChange={(e, value) => value && handleSize(value)}
                    >
                        {sizes.map((s) => (
                            <ToggleButton key={s} value={s} disabled={sizeSoldOut(s)}>
                                {s}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </div>

                <div className="option-group">
                    <Typography variant="subtitle2">Color</Typography>
                    <ToggleButtonGroup
                        exclusive
                        size="small"
                        sx={{ flexWrap: 'wrap' }}
                        value={color}
                        onChange={(e, value) => value && handleColor(value)}
                    >
                        {colorOptions.map((v) => (
                            <ToggleButton key={v.color} value={v.color} disabled={v.stock === 0}>
                                {v.color}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </div>

                <div>{stockLabel}</div>

                <div className="option-group">
                    <Typography variant="subtitle2">Quantity</Typography>
                    <div className="qty-control">
                        <IconButton
                            size="small"
                            aria-label="Decrease quantity"
                            onClick={() => setQuantity((q) => q - 1)}
                            disabled={quantity <= 1}
                        >
                            <RemoveIcon />
                        </IconButton>
                        <span className="qty-value">{quantity}</span>
                        <IconButton
                            size="small"
                            aria-label="Increase quantity"
                            onClick={() => setQuantity((q) => q + 1)}
                            disabled={outOfStock || quantity >= selected.stock}
                        >
                            <AddIcon />
                        </IconButton>
                    </div>
                </div>

                <div>
                    <Button variant="contained" size="large" onClick={handleAddToCart} disabled={outOfStock}>
                        Add to cart
                    </Button>
                </div>

                <ul className="product-meta">
                    <li>Category: {product.category}</li>
                    <li>Gender: {product.gender}</li>
                    {product.material && <li>Material: {product.material}</li>}
                </ul>
            </div>
        </div>
    );
}

export default function ProductDetails() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { product, error } = useSelector((state) => state.productDetails);
    const { products: related } = useSelector((state) => state.relatedProducts);

    useEffect(() => {
        window.scrollTo({ top: 0 });
        dispatch(getProductDetails(id));
        dispatch(getRelatedProducts(id));
    }, [dispatch, id]);

    // The store can still hold the previously viewed product for one render
    const ready = product && product._id === id;

    if (error) {
        return (
            <div className="catalog-message">
                <Typography color="error">{error}</Typography>
                <Button component={Link} to="/">
                    Back to shop
                </Button>
            </div>
        );
    }

    if (!ready) {
        return (
            <div className="catalog-message">
                <CircularProgress />
            </div>
        );
    }

    return (
        <>
            <Button component={Link} to="/" className="back-link">
                ← Back to shop
            </Button>

            <ProductInfo key={product._id} product={product} />

            <ListReviews productId={product._id} />

            {related.length > 0 && (
                <section className="related-products">
                    <Typography variant="h5" component="h2" gutterBottom>
                        You May Also Like
                    </Typography>
                    <div className="product-grid">
                        {related.map((item) => (
                            <ProductCard key={item._id} product={item} />
                        ))}
                    </div>
                </section>
            )}
        </>
    );
}
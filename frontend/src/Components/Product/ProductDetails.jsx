import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Button,
    Chip,
    CircularProgress,
    Drawer,
    IconButton,
    Rating,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import MetaData from '../Layout/MetaData';
import { getProductDetails, getRelatedProducts } from '../../actions/productActions';
import { addToCart } from '../../actions/cartActions';
import { notifyError, notifySuccess } from '../../Utils/helpers';
import { getColorImages, getColors } from '../../Utils/productImages';
import ProductCard from './ProductCard';
import ListReviews from '../Review/ListReviews';

const VISIBLE_COLORS = 6;

// One color tile: a photo of that color, crossed out when it can't be bought
function ColorOption({ product, name, selected, unavailable, onSelect, showName = false }) {
    const classes = ['color-option', selected && 'selected', unavailable && 'cross-out', showName && 'with-name'];

    return (
        <button
            type="button"
            className={classes.filter(Boolean).join(' ')}
            onClick={() => onSelect(name)}
            aria-pressed={selected}
            aria-label={unavailable ? `${name} (unavailable)` : name}
            title={unavailable ? `${name} - unavailable` : name}
        >
            <span className="color-thumb">
                <img src={getColorImages(product, name)[0]?.url} alt="" />
            </span>
            {showName && <span className="color-name">{name}</span>}
        </button>
    );
}

// Separate component so the selected image, size, color, and quantity reset whenever the product changes
function ProductInfo({ product }) {
    const dispatch = useDispatch();
    const firstAvailable = product.variants.find((v) => v.stock > 0) || product.variants[0];

    const [activeImage, setActiveImage] = useState(0);
    const [size, setSize] = useState(firstAvailable.size);
    const [color, setColor] = useState(firstAvailable.color);
    const [quantity, setQuantity] = useState(1);
    const [colorsOpen, setColorsOpen] = useState(false);

    const sizes = [...new Set(product.variants.map((v) => v.size))];
    const colorNames = getColors(product);
    const selected = product.variants.find((v) => v.size === size && v.color === color);

    // Each color has its own photos. Picking a color swaps the whole gallery.
    const images = getColorImages(product, color);
    const mainImage = images[activeImage] || images[0];

    // Load the first photo of every color up front so switching colors feels instant
    useEffect(() => {
        product.variants.forEach((v) => {
            const url = getColorImages(product, v.color)[0]?.url;
            if (url) new Image().src = url;
        });
    }, [product]);

    // Unavailable options stay clickable so shoppers can still look at them, but they are crossed out
    // and "Add to cart" is disabled. A color is unavailable in the chosen size, a size in the chosen color.
    const inStock = (s, c) => product.variants.some((v) => v.size === s && v.color === c && v.stock > 0);
    const colorUnavailable = (c) => !inStock(size, c);
    const sizeUnavailable = (s) => !inStock(s, color);

    // First six colors in the row; the rest are in the side panel. The chosen color is always visible.
    let visibleColors = colorNames.slice(0, VISIBLE_COLORS);
    if (!visibleColors.includes(color)) visibleColors = [...visibleColors.slice(0, VISIBLE_COLORS - 1), color];
    const hasMoreColors = colorNames.length > VISIBLE_COLORS;

    const showPhoto = (index) => setActiveImage((index + images.length) % images.length);

    const handleSize = (newSize) => {
        setSize(newSize);
        setQuantity(1);
    };

    const handleColor = (newColor) => {
        setColor(newColor);
        setActiveImage(0);
        setQuantity(1);
        setColorsOpen(false);
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
        <>
        <div className="product-detail">
            <div className="product-gallery">
                <div className="product-gallery-frame">
                    <img src={mainImage?.url} alt={`${product.name} in ${color}`} className="product-gallery-main" />
                    {images.length > 1 && (
                        <>
                            <IconButton
                                className="gallery-arrow gallery-arrow-left"
                                aria-label="Previous photo"
                                onClick={() => showPhoto(activeImage - 1)}
                            >
                                <ChevronLeftIcon />
                            </IconButton>
                            <IconButton
                                className="gallery-arrow gallery-arrow-right"
                                aria-label="Next photo"
                                onClick={() => showPhoto(activeImage + 1)}
                            >
                                <ChevronRightIcon />
                            </IconButton>
                            <span className="gallery-counter">
                                {activeImage + 1} / {images.length}
                            </span>
                        </>
                    )}
                </div>
                {images.length > 1 && (
                    <div className="product-thumbs">
                        {images.map((img, index) => (
                            <img
                                key={img.public_id}
                                src={img.url}
                                alt={`${product.name} ${color} ${index + 1}`}
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
                            <ToggleButton key={s} value={s} className={sizeUnavailable(s) ? 'cross-out' : undefined}>
                                {s}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </div>

                <div className="option-group">
                    <Typography variant="subtitle2">Select color: {color}</Typography>
                    <div className="color-options">
                        {visibleColors.map((name) => (
                            <ColorOption
                                key={name}
                                product={product}
                                name={name}
                                selected={name === color}
                                unavailable={colorUnavailable(name)}
                                onSelect={handleColor}
                            />
                        ))}
                    </div>
                    {hasMoreColors && (
                        <button type="button" className="more-colors" onClick={() => setColorsOpen(true)}>
                            More colours <ChevronRightIcon fontSize="small" />
                        </button>
                    )}
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

        <Drawer anchor="right" open={colorsOpen} onClose={() => setColorsOpen(false)}>
            <div className="color-drawer">
                <div className="color-drawer-header">
                    <Typography variant="subtitle2">SELECT COLOR</Typography>
                    <IconButton aria-label="Close" onClick={() => setColorsOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </div>
                <div className="color-drawer-grid">
                    {colorNames.map((name) => (
                        <ColorOption
                            key={name}
                            product={product}
                            name={name}
                            selected={name === color}
                            unavailable={colorUnavailable(name)}
                            onSelect={handleColor}
                            showName
                        />
                    ))}
                </div>
            </div>
        </Drawer>
        </>
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
            <MetaData title={product.name} />
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
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Button,
    Chip,
    Drawer,
    IconButton,
    Rating,
    Skeleton,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MetaData from '../Layout/MetaData';
import { getProductDetails, getRelatedProducts, deleteProduct } from '../../actions/productActions';
import { confirmDelete, notifyError, notifySuccess } from '../../Utils/helpers';
import { addToCart } from '../../actions/cartActions';
import { getColorImages, getColors } from '../../Utils/productImages';
import ProductCard from './ProductCard';
import ListReviews from '../Review/ListReviews';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { DELETE_PRODUCT_RESET } from '../../constants/productConstants';

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

// A row that opens and closes. Starts closed.
function InfoSection({ title, children }) {
    const [open, setOpen] = useState(false);

    return (
        <Accordion
            expanded={open}
            onChange={(e, isOpen) => setOpen(isOpen)}
            disableGutters
            elevation={0}
            square
            className="info-section"
        >
            <AccordionSummary expandIcon={open ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}>
                <Typography className="info-section-title">{title}</Typography>
            </AccordionSummary>
            <AccordionDetails>{children}</AccordionDetails>
        </Accordion>
    );
}

// Placeholder that mirrors the real page layout while the product loads
function ProductDetailsSkeleton() {
    return (
        <div className="product-skeleton" aria-busy="true" aria-label="Loading product">
            <Skeleton variant="rounded" width={110} height={32} sx={{ mb: 1 }} />

            <div className="product-detail">
                {/* Gallery */}
                <div className="product-gallery">
                    <Skeleton
                        variant="rounded"
                        animation="wave"
                        sx={{ width: '100%', height: 'auto', aspectRatio: '1 / 1', borderRadius: '8px' }}
                    />
                    <div className="product-thumbs">
                        {[0, 1, 2, 3].map((i) => (
                            <Skeleton key={i} variant="rounded" animation="wave" width={72} height={72} />
                        ))}
                    </div>
                </div>

                {/* Info */}
                <div className="product-info">
                    <Skeleton variant="text" animation="wave" width={90} sx={{ fontSize: '0.875rem' }} />
                    <Skeleton variant="text" animation="wave" width="75%" sx={{ fontSize: '2.125rem' }} />
                    <Skeleton variant="text" animation="wave" width={170} />
                    <Skeleton variant="text" animation="wave" width={110} sx={{ fontSize: '1.5rem' }} />

                    <div className="option-group">
                        <Skeleton variant="text" animation="wave" width={40} />
                        <Stack direction="row" spacing={1}>
                            {[0, 1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} variant="rounded" animation="wave" width={35} height={29} />
                            ))}
                        </Stack>
                    </div>

                    <div className="option-group">
                        <Skeleton variant="text" animation="wave" width={140} />
                        <div className="color-options">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} variant="rounded" animation="wave" width={64} height={64} />
                            ))}
                        </div>
                    </div>

                    <Skeleton variant="rounded" animation="wave" width={80} height={24} sx={{ borderRadius: 99 }} />

                    <div className="option-group">
                        <Skeleton variant="text" animation="wave" width={60} />
                        <Skeleton variant="rounded" animation="wave" width={110} height={34} />
                    </div>

                    <Skeleton variant="rounded" animation="wave" width="100%" height={46} />

                    <div className="info-sections">
                        {[0, 1, 2].map((i) => (
                            <Skeleton key={i} variant="text" animation="wave" height={48} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Related products */}
            <section className="related-products">
                <Skeleton variant="text" animation="wave" width={220} sx={{ fontSize: '1.5rem', mb: 1 }} />
                <div className="product-grid">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i}>
                            <Skeleton
                                variant="rounded"
                                animation="wave"
                                sx={{ width: '100%', height: 'auto', aspectRatio: '3 / 4' }}
                            />
                            <Skeleton variant="text" animation="wave" width="80%" sx={{ mt: 1 }} />
                            <Skeleton variant="text" animation="wave" width="40%" />
                        </div>
                    ))}
                </div>
            </section>
        </div>
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

    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { loading: deleting, isDeleted } = useSelector((state) => state.product);
    const isAdmin = user?.role === 'admin';

    // After a delete succeeds, go back to the admin product list
    useEffect(() => {
        if (isDeleted && isAdmin) {
            notifySuccess('Product deleted');
            dispatch({ type: DELETE_PRODUCT_RESET });
            navigate('/admin/products', { replace: true });
        }
    }, [isDeleted, isAdmin, dispatch, navigate]);

    const handleDelete = async () => {
        const confirmed = await confirmDelete(`Delete "${product.name}"? Its images and reviews will be removed too.`);
        if (confirmed) dispatch(deleteProduct(product._id));
    };

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

    let stockLabel = <Chip label="IN STOCK" size="small" color="success" />;
    if (outOfStock) {
        stockLabel = <Chip label="OUT OF STOCK" size="small" color="error" />;
    } else if (selected.stock <= 5) {
        stockLabel = <Chip label={`ONLY ${selected.stock} LEFT`} size="small" color="warning" />;
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
                    <Rating value={product.ratings} precision={0.5} size="small" readOnly />
                    <Typography variant="body2">
                        {product.numOfReviews} review{product.numOfReviews === 1 ? '' : 's'}
                    </Typography>
                </div>

                <Typography variant="h5">₱{product.price.toLocaleString()}</Typography>

                <div className="option-group">
                    <Typography variant="subtitle2">Size</Typography>
                    <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
                        {sizes.map((s) => (
                            <ToggleButton
                                key={s}
                                value={s}
                                selected={s === size}
                                onChange={() => handleSize(s)}
                                className={sizeUnavailable(s) ? 'cross-out' : undefined}
                                sx={{
                                    minWidth: 35,
                                    height: 29,
                                    px: 1,
                                    fontSize: '0.8rem',
                                    fontWeight: 400,
                                    borderRadius: '6px',
                                    border: '1px solid #d4d4d4',
                                    color: 'var(--brand-dark)',
                                    textTransform: 'none',
                                    '&:hover': { borderColor: 'var(--brand-dark)', bgcolor: '#fff' },
                                    '&.Mui-selected, &.Mui-selected:hover': {
                                        bgcolor: 'var(--brand-dark)',
                                        borderColor: 'var(--brand-dark)',
                                        color: '#fff',
                                    },
                                }}
                            >
                                {s}
                            </ToggleButton>
                        ))}
                    </Stack>
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

                {isAdmin ? (
                    <div className="admin-product-actions">
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            component={Link}
                            to={`/admin/product/${product._id}`}
                            startIcon={<EditOutlinedIcon />}
                            className="admin-btn admin-btn-primary"
                        >
                            Edit product
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            fullWidth
                            startIcon={<DeleteOutlinedIcon />}
                            onClick={handleDelete}
                            disabled={deleting}
                            className="admin-btn admin-btn-danger"
                        >
                            {deleting ? 'Deleting...' : 'Delete product'}
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="option-group">
                            <Typography variant="body2">Quantity:</Typography>
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

                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            className="add-to-cart"
                            onClick={handleAddToCart}
                            disabled={outOfStock}
                        >
                            {outOfStock ? 'Out of stock' : 'Add to cart'}
                        </Button>
                    </>
                )}

                <div className="info-sections">
                    <InfoSection title="Product description">
                        <p className="product-description">{product.description}</p>
                    </InfoSection>

                    <InfoSection title="Product details">
                        <ul className="product-meta">
                            <li>Category: {product.category}</li>
                            <li>Gender: {product.gender}</li>
                            {product.material && <li>Material: {product.material}</li>}
                        </ul>
                    </InfoSection>

                    <InfoSection title="Delivery & returns">
                        <ul className="product-meta">
                            <li>Standard delivery is free on every order.</li>
                            <li>Pay with Cash on Delivery or by card at checkout.</li>
                            <li>We email you a receipt, and again each time your order status changes.</li>
                            <li>Need to return or exchange something? Message us with your order number and we'll sort it out.</li>
                        </ul>
                    </InfoSection>
                </div>
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
        return <ProductDetailsSkeleton />;
    }

    return (
        <>
            <MetaData title={product.name} />
            <Button component={Link} to="/" className="back-link">
                ← Back to shop
            </Button>

            <ProductInfo key={product._id} product={product} />

            <ListReviews key={product._id} productId={product._id} />

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
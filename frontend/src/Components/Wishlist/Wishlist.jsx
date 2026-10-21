// EXTRA · Wishlist — saved-products page.
// Lists the customer's wishlist and links to each product; fed by the wishlist reducer.
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, IconButton, Skeleton, Typography } from '@mui/material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { getWishlist, removeFromWishlist } from '../../actions/wishlistActions';
import { clearErrors } from '../../actions/userActions';
import { getCardImages } from '../../Utils/productImages';
import { notifyError, notifySuccess, peso } from '../../Utils/helpers';

function RowSkeleton() {
    return (
        <div className="cart-row wishlist-row" aria-hidden="true">
            <Skeleton variant="rounded" width={96} height={96} animation="wave" />
            <div className="cart-row-info">
                <Skeleton variant="text" width="55%" animation="wave" />
                <Skeleton variant="text" width="30%" animation="wave" />
                <Skeleton variant="text" width="20%" animation="wave" />
            </div>
        </div>
    );
}

export default function Wishlist() {
    const dispatch = useDispatch();
    const { items, loading, loaded, error } = useSelector((state) => state.wishlist);

    // Always refresh when the page opens, so it matches what is on the server
    useEffect(() => {
        dispatch(getWishlist());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            notifyError(error);
            dispatch(clearErrors());
        }
    }, [error, dispatch]);

    const handleRemove = async (productId) => {
        const message = await dispatch(removeFromWishlist(productId));
        if (message) notifyError(message);
        else notifySuccess('Removed from wishlist');
    };

    if (loading && !loaded) {
        return (
            <div className="cart-page page-enter">
                <div className="cart-header">
                    <Typography variant="h4" component="h1" className="cart-title">
                        My wishlist
                    </Typography>
                </div>
                <div className="cart-list">
                    {[0, 1, 2].map((i) => (
                        <RowSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="cart-empty page-enter">
                <div className="cart-empty-icon">
                    <FavoriteBorderIcon />
                </div>
                <Typography variant="h5" component="h1" className="cart-empty-title">
                    Your wishlist is empty
                </Typography>
                <Typography color="text.secondary" className="cart-empty-text">
                    Tap the heart on any product to save it here for later.
                </Typography>
                <Button variant="contained" component={Link} to="/" className="cart-empty-btn">
                    Start shopping
                </Button>
            </div>
        );
    }

    return (
        <div className="cart-page page-enter">
            <div className="cart-header">
                <Typography variant="h4" component="h1" className="cart-title">
                    My wishlist
                </Typography>
                <Typography color="text.secondary">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                </Typography>
            </div>

            <div className="cart-list">
                {items.map((product) => (
                    <div className="cart-row wishlist-row" key={product._id}>
                        <Link to={`/product/${product._id}`} className="cart-row-image-link">
                            <img
                                src={getCardImages(product).cover}
                                alt={product.name}
                                className="cart-row-image"
                            />
                        </Link>

                        <div className="cart-row-info">
                            <Link to={`/product/${product._id}`} className="cart-row-name">
                                {product.name}
                            </Link>
                            <div className="cart-row-tags">
                                <span className="cart-tag">{product.category}</span>
                                {product.totalStock === 0 && (
                                    <span className="cart-tag wishlist-tag-out">Sold out</span>
                                )}
                            </div>
                            <Typography className="wishlist-row-price">
                                {peso(product.price)}
                            </Typography>
                        </div>

                        <Button
                            variant="outlined"
                            component={Link}
                            to={`/product/${product._id}`}
                            className="wishlist-view-btn"
                        >
                            View product
                        </Button>

                        <IconButton
                            className="cart-row-remove"
                            aria-label={`Remove ${product.name} from wishlist`}
                            onClick={() => handleRemove(product._id)}
                        >
                            <DeleteOutlinedIcon />
                        </IconButton>
                    </div>
                ))}

                <Button
                    component={Link}
                    to="/"
                    startIcon={<ArrowBackRoundedIcon />}
                    className="cart-continue"
                >
                    Continue shopping
                </Button>
            </div>
        </div>
    );
}

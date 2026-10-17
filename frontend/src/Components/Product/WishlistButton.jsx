import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { addToWishlist, removeFromWishlist } from '../../actions/wishlistActions';
import { notifyError, notifyInfo, notifySuccess } from '../../Utils/helpers';

// Heart that saves / un-saves a product.
// variant "card": small round button on a product photo. variant "detail": square button beside Add to cart.
export default function WishlistButton({ product, variant = 'card' }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading } = useSelector((state) => state.auth);
    const saved = useSelector((state) => state.wishlist.items.some((p) => p._id === product._id));

    // Admins don't shop, so they have no wishlist
    if (user?.role === 'admin') return null;

    const handleClick = async (event) => {
        // On a product card this sits inside a link: don't open the product page
        event.preventDefault();
        event.stopPropagation();

        if (loading) return;
        if (!user) {
            notifyInfo('Log in to save items to your wishlist');
            navigate('/login', { state: { from: location } });
            return;
        }

        const message = await dispatch(saved ? removeFromWishlist(product._id) : addToWishlist(product));
        if (message) notifyError(message);
        else notifySuccess(saved ? 'Removed from wishlist' : 'Saved to wishlist');
    };

    return (
        <IconButton
            className={`wishlist-btn wishlist-btn-${variant}${saved ? ' saved' : ''}`}
            aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={saved}
            onClick={handleClick}
        >
            {saved ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>
    );
}
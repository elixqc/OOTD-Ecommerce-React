import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { removeFromCart, updateCartQuantity } from '../../actions/cartActions';
import { notifyInfo, peso } from '../../Utils/helpers';

export default function Cart() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { cartItems } = useSelector((state) => state.cart);
    const { user, loading } = useSelector((state) => state.auth);

    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleCheckout = () => {
        // While the saved login is still being restored, let the checkout route decide
        if (user || loading) {
            navigate('/shipping');
            return;
        }

        // After logging in, the login page sends them straight to checkout
        notifyInfo('Please log in to check out');
        navigate('/login', { state: { from: { pathname: '/shipping' } } });
    };

    if (cartItems.length === 0) {
        return (
            <div className="cart-empty page-enter">
                <div className="cart-empty-icon">
                    <ShoppingBagOutlinedIcon />
                </div>
                <Typography variant="h5" component="h1" className="cart-empty-title">
                    Your cart is empty
                </Typography>
                <Typography color="text.secondary" className="cart-empty-text">
                    Looks like you haven't added anything yet. Find something you love and it'll show up here.
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
                    Shopping cart
                </Typography>
                <Typography color="text.secondary">
                    {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
                </Typography>
            </div>

            <div className="cart-layout">
                <div className="cart-list">
                    {cartItems.map((item) => (
                        <div className="cart-row" key={item.key}>
                            <Link to={`/product/${item.product}`} className="cart-row-image-link">
                                <img src={item.image} alt={item.name} className="cart-row-image" />
                            </Link>

                            <div className="cart-row-info">
                                <Link to={`/product/${item.product}`} className="cart-row-name">
                                    {item.name}
                                </Link>
                                <div className="cart-row-tags">
                                    <span className="cart-tag">Size: {item.size}</span>
                                    <span className="cart-tag">Color: {item.color}</span>
                                </div>
                                <Typography variant="body2" color="text.secondary">
                                    {peso(item.price)} each
                                </Typography>
                            </div>

                            <div className="cart-row-qty">
                                <IconButton
                                    size="small"
                                    aria-label="Decrease quantity"
                                    onClick={() => dispatch(updateCartQuantity(item.key, item.quantity - 1))}
                                    disabled={item.quantity <= 1}
                                >
                                    <RemoveIcon fontSize="small" />
                                </IconButton>
                                <span className="qty-value">{item.quantity}</span>
                                <IconButton
                                    size="small"
                                    aria-label="Increase quantity"
                                    onClick={() => dispatch(updateCartQuantity(item.key, item.quantity + 1))}
                                    disabled={item.quantity >= item.stock}
                                >
                                    <AddIcon fontSize="small" />
                                </IconButton>
                            </div>

                            <Typography className="cart-row-subtotal">{peso(item.price * item.quantity)}</Typography>

                            <IconButton
                                className="cart-row-remove"
                                aria-label={`Remove ${item.name} from cart`}
                                onClick={() => dispatch(removeFromCart(item.key))}
                            >
                                <DeleteOutlineIcon />
                            </IconButton>
                        </div>
                    ))}

                    <Button component={Link} to="/" startIcon={<ArrowBackRoundedIcon />} className="cart-continue">
                        Continue shopping
                    </Button>
                </div>

                <aside className="cart-summary">
                    <Typography component="h2" className="cart-summary-title">
                        Order summary
                    </Typography>
                    <div className="cart-summary-row">
                        <span>Subtotal ({totalQuantity})</span>
                        <span>{peso(total)}</span>
                    </div>
                    <div className="cart-summary-row">
                        <span>Shipping</span>
                        <span>Free</span>
                    </div>
                    <div className="cart-summary-row cart-summary-total">
                        <span>Total</span>
                        <span>{peso(total)}</span>
                    </div>
                    <Button variant="contained" size="large" onClick={handleCheckout} className="cart-checkout-btn">
                        Proceed to checkout
                    </Button>
                </aside>
            </div>
        </div>
    );
}
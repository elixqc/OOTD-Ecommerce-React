import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveIcon from '@mui/icons-material/Remove';
import { removeFromCart, updateCartQuantity } from '../../actions/cartActions';
import { peso } from '../../Utils/helpers';

export default function Cart() {
    const dispatch = useDispatch();
    const { cartItems } = useSelector((state) => state.cart);

    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (cartItems.length === 0) {
        return (
            <div className="catalog-message">
                <Typography variant="h5">Your cart is empty</Typography>
                <Button variant="contained" component={Link} to="/">
                    Continue shopping
                </Button>
            </div>
        );
    }

    return (
        <>
            <Typography variant="h4" component="h1" className="page-title">
                Shopping cart
            </Typography>

            <div className="cart-layout">
                <div>
                    {cartItems.map((item) => (
                        <div className="cart-item" key={item.key}>
                            <Link to={`/product/${item.product}`}>
                                <img src={item.image} alt={item.name} className="cart-item-image" />
                            </Link>

                            <div>
                                <Typography
                                    variant="subtitle1"
                                    component={Link}
                                    to={`/product/${item.product}`}
                                    className="cart-item-name"
                                >
                                    {item.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Size: {item.size} · Color: {item.color}
                                </Typography>
                                <Typography variant="body2">{peso(item.price)} each</Typography>
                            </div>

                            <div className="qty-control">
                                <IconButton
                                    size="small"
                                    aria-label="Decrease quantity"
                                    onClick={() => dispatch(updateCartQuantity(item.key, item.quantity - 1))}
                                    disabled={item.quantity <= 1}
                                >
                                    <RemoveIcon />
                                </IconButton>
                                <span className="qty-value">{item.quantity}</span>
                                <IconButton
                                    size="small"
                                    aria-label="Increase quantity"
                                    onClick={() => dispatch(updateCartQuantity(item.key, item.quantity + 1))}
                                    disabled={item.quantity >= item.stock}
                                >
                                    <AddIcon />
                                </IconButton>
                            </div>

                            <Typography variant="subtitle1" className="cart-item-subtotal">
                                {peso(item.price * item.quantity)}
                            </Typography>

                            <IconButton
                                color="error"
                                aria-label={`Remove ${item.name} from cart`}
                                onClick={() => dispatch(removeFromCart(item.key))}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </div>
                    ))}
                </div>

                <aside className="cart-summary">
                    <Typography variant="h6">Order summary</Typography>
                    <div className="cart-summary-row">
                        <span>Items ({totalQuantity})</span>
                        <span>{peso(total)}</span>
                    </div>
                    <div className="cart-summary-row cart-summary-total">
                        <span>Total</span>
                        <span>{peso(total)}</span>
                    </div>
                    <Button variant="contained" component={Link} to="/shipping">
                        Proceed to checkout
                    </Button>
                    <Button component={Link} to="/">
                        Continue shopping
                    </Button>
                </aside>
            </div>
        </>
    );
}
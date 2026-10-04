import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Typography } from '@mui/material';
import CheckoutSteps from './CheckoutSteps';
import { NEW_ORDER_RESET } from '../../constants/orderConstants';
import { peso } from '../../Utils/helpers';

export default function ConfirmOrder() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { cartItems, shippingInfo } = useSelector((state) => state.cart);

    const itemsPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingPrice = 0;
    const totalPrice = itemsPrice + shippingPrice;

    // Forget the previous order, so the success page only shows a fresh one
    useEffect(() => {
        dispatch({ type: NEW_ORDER_RESET });
    }, [dispatch]);

    useEffect(() => {
        if (cartItems.length === 0) navigate('/cart', { replace: true });
        else if (!shippingInfo) navigate('/shipping', { replace: true });
    }, [cartItems.length, shippingInfo, navigate]);

    if (!shippingInfo || cartItems.length === 0) return null;

    return (
        <>
            <CheckoutSteps activeStep={1} />
            <Typography variant="h4" component="h1" className="page-title">
                Confirm order
            </Typography>

            <div className="cart-layout">
                <div>
                    <section className="order-card">
                        <Typography variant="h6">Shipping to</Typography>
                        <Typography variant="body2">{shippingInfo.address}</Typography>
                        <Typography variant="body2">
                            {shippingInfo.city}, {shippingInfo.postalCode}, {shippingInfo.country}
                        </Typography>
                        <Typography variant="body2">Phone: {shippingInfo.phoneNo}</Typography>
                        <Button size="small" component={Link} to="/shipping">
                            Change
                        </Button>
                    </section>

                    <section className="order-card">
                        <Typography variant="h6">Items</Typography>
                        {cartItems.map((item) => (
                            <div className="order-item" key={item.key}>
                                <img src={item.image} alt={item.name} className="order-item-image" />
                                <div>
                                    <Typography variant="subtitle2">{item.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Size: {item.size} · Color: {item.color}
                                    </Typography>
                                    <Typography variant="body2">
                                        {item.quantity} × {peso(item.price)}
                                    </Typography>
                                </div>
                                <Typography variant="subtitle2">{peso(item.price * item.quantity)}</Typography>
                            </div>
                        ))}
                    </section>
                </div>

                <aside className="cart-summary">
                    <Typography variant="h6">Order summary</Typography>
                    <div className="cart-summary-row">
                        <span>Items</span>
                        <span>{peso(itemsPrice)}</span>
                    </div>
                    <div className="cart-summary-row">
                        <span>Shipping</span>
                        <span>{shippingPrice === 0 ? 'Free' : peso(shippingPrice)}</span>
                    </div>
                    <div className="cart-summary-row cart-summary-total">
                        <span>Total</span>
                        <span>{peso(totalPrice)}</span>
                    </div>
                    <Button variant="contained" component={Link} to="/payment">
                        Continue to payment
                    </Button>
                    <Button component={Link} to="/cart">
                        Back to cart
                    </Button>
                </aside>
            </div>
        </>
    );
}

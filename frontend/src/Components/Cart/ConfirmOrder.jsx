import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@mui/material';
import { NEW_ORDER_RESET } from '../../constants/orderConstants';

export default function ConfirmOrder() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { cartItems, shippingInfo } = useSelector((state) => state.cart);
    const { user } = useSelector((state) => state.auth);

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
            <section className="review-box">
                <div className="review-row">
                    <span className="review-label">Contact</span>
                    <span className="review-value">{user?.email}</span>
                </div>
                <div className="review-row">
                    <span className="review-label">Ship to</span>
                    <span className="review-value">
                        {shippingInfo.address}, {shippingInfo.city} {shippingInfo.postalCode}, {shippingInfo.country}
                    </span>
                    <Link to="/shipping" className="review-change">
                        Change
                    </Link>
                </div>
                <div className="review-row">
                    <span className="review-label">Phone</span>
                    <span className="review-value">{shippingInfo.phoneNo}</span>
                    <Link to="/shipping" className="review-change">
                        Change
                    </Link>
                </div>
            </section>

            <section className="checkout-section">
                <h2 className="checkout-heading">Shipping method</h2>
                <div className="method-box">
                    <span>Standard delivery</span>
                    <strong>Free</strong>
                </div>
            </section>

            <div className="checkout-actions">
                <Link to="/shipping" className="checkout-back">
                    ‹ Return to shipping
                </Link>
                <Button variant="contained" size="large" component={Link} to="/payment">
                    Continue to payment
                </Button>
            </div>
        </>
    );
}
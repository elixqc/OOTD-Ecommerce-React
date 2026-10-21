// TTL · Transactions — order-placed page.
// Confirms success and links to the order history after newOrder resolves.
import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button, Typography } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CheckoutSteps from './CheckoutSteps';
import { peso, shortOrderId } from '../../Utils/helpers';

export default function OrderSuccess() {
    const { order } = useSelector((state) => state.newOrder);

    // Opened directly, without placing an order
    if (!order) return <Navigate to="/orders/me" replace />;
    const { shippingInfo = {} } = order;
    const shipTo = [
        shippingInfo.address,
        shippingInfo.city,
        shippingInfo.region,
        shippingInfo.postalCode,
        shippingInfo.country,
    ]
        .filter(Boolean)
        .join(', ');

    return (
        <>
            <CheckoutSteps activeStep={4} />
            <div className="order-done page-enter">
                <div className="order-done-icon">
                    <CheckRoundedIcon />
                </div>
                <Typography variant="h5" component="h1" className="order-done-title">
                    Order placed!
                </Typography>
                <Typography color="text.secondary" className="order-done-text">
                    Thank you for shopping with us.{' '}
                    {order.isPaid
                        ? 'Your card payment was received.'
                        : 'Please prepare the exact amount, since payment is Cash on Delivery.'}
                </Typography>

                <div className="order-done-card">
                    <div className="order-done-head">
                        <span>Order number</span>
                        <strong>{shortOrderId(order._id)}</strong>
                    </div>

                    <div className="order-done-items">
                        {order.orderItems.map((item, i) => (
                            <div className="order-done-item" key={i}>
                                <img src={item.image} alt={item.name} />
                                <div className="order-done-item-info">
                                    <span className="order-done-item-name">{item.name}</span>
                                    <span className="order-done-item-meta">
                                        {item.size} / {item.color} · Qty {item.quantity}
                                    </span>
                                </div>
                                <span>{peso(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="order-done-row">
                        <span>Ship to</span>
                        <span>{shipTo}</span>
                    </div>
                    <div className="order-done-row">
                        <span>Payment</span>
                        <span>{order.paymentMethod}</span>
                    </div>
                    <div className="order-done-row order-done-total">
                        <span>Total</span>
                        <span>{peso(order.totalPrice)}</span>
                    </div>
                </div>

                <Typography variant="body2" color="text.secondary">
                    We'll email you a receipt, and another email whenever your order status changes.
                </Typography>

                <div className="order-done-actions">
                    <Button
                        variant="contained"
                        component={Link}
                        to={`/order/${order._id}`}
                        className="order-done-btn"
                    >
                        View order
                    </Button>
                    <Button component={Link} to="/" className="order-done-link">
                        Continue shopping
                    </Button>
                </div>
            </div>
        </>
    );
}

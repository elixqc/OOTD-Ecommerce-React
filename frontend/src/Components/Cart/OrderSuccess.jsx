import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button, Typography } from '@mui/material';
import CheckoutSteps from './CheckoutSteps';
import { peso, shortOrderId } from '../../Utils/helpers';

export default function OrderSuccess() {
    const { order } = useSelector((state) => state.newOrder);

    // Opened directly, without placing an order
    if (!order) return <Navigate to="/orders/me" replace />;

    return (
        <>
            <CheckoutSteps activeStep={4} />
            <div className="catalog-message">
                <Typography variant="h4" component="h1">
                    Order placed!
                </Typography>
                <Typography>
                    Thank you. Your order {shortOrderId(order._id)} totals {peso(order.totalPrice)}.{' '}
                    {order.isPaid
                        ? 'Your card payment was received.'
                        : 'Please prepare the exact amount, since payment is Cash on Delivery.'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    We'll email you a receipt, and another email whenever your order status changes.
                </Typography>
                <div className="button-row">
                    <Button variant="contained" component={Link} to={`/order/${order._id}`}>
                        View order
                    </Button>
                    <Button component={Link} to="/">
                        Continue shopping
                    </Button>
                </div>
            </div>
        </>
    );
}

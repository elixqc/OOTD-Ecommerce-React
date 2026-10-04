import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import OrderStatusChip from './OrderStatusChip';
import { formatDate, peso, shortOrderId } from '../../Utils/helpers';

// Shipping, payment, items and totals of one order. Used by the customer and admin pages.
// itemAction(item) can return extra content under each item, e.g. a Review button
export default function OrderInfo({ order, itemAction }) {
    const { shippingInfo: ship } = order;

    return (
        <div className="order-layout">
            <div>
                <section className="order-card">
                    <Typography variant="h6">Shipping</Typography>
                    {order.user?.name && <Typography variant="body2">{order.user.name}</Typography>}
                    <Typography variant="body2">{ship.address}</Typography>
                    <Typography variant="body2">
                        {ship.city}, {ship.postalCode}, {ship.country}
                    </Typography>
                    <Typography variant="body2">Phone: {ship.phoneNo}</Typography>
                </section>

                <section className="order-card">
                    <Typography variant="h6">Items</Typography>
                    {order.orderItems.map((item) => (
                        <div className="order-item" key={`${item.product}|${item.size}|${item.color}`}>
                            <img src={item.image} alt={item.name} className="order-item-image" />
                            <div>
                                <Typography
                                    variant="subtitle2"
                                    component={Link}
                                    to={`/product/${item.product}`}
                                    className="cart-item-name"
                                >
                                    {item.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Size: {item.size} · Color: {item.color}
                                </Typography>
                                <Typography variant="body2">
                                    {item.quantity} × {peso(item.price)}
                                </Typography>
                                {itemAction && itemAction(item)}
                            </div>
                            <Typography variant="subtitle2">{peso(item.price * item.quantity)}</Typography>
                        </div>
                    ))}
                </section>
            </div>

            <aside className="cart-summary">
                <Typography variant="h6">Order {shortOrderId(order._id)}</Typography>
                <div className="cart-summary-row">
                    <span>Status</span>
                    <OrderStatusChip status={order.orderStatus} />
                </div>
                <div className="cart-summary-row">
                    <span>Placed</span>
                    <span>{formatDate(order.createdAt)}</span>
                </div>
                {order.deliveredAt && (
                    <div className="cart-summary-row">
                        <span>Delivered</span>
                        <span>{formatDate(order.deliveredAt)}</span>
                    </div>
                )}
                <div className="cart-summary-row">
                    <span>Payment</span>
                    <span>{order.paymentMethod}</span>
                </div>
                <div className="cart-summary-row">
                    <span>Items</span>
                    <span>{peso(order.itemsPrice)}</span>
                </div>
                <div className="cart-summary-row">
                    <span>Shipping</span>
                    <span>{order.shippingPrice === 0 ? 'Free' : peso(order.shippingPrice)}</span>
                </div>
                <div className="cart-summary-row cart-summary-total">
                    <span>Total</span>
                    <span>{peso(order.totalPrice)}</span>
                </div>
            </aside>
        </div>
    );
}

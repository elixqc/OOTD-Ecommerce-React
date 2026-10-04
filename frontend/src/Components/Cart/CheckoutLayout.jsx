import { Link, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Badge, Breadcrumbs, IconButton, Typography } from '@mui/material';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { peso } from '../../Utils/helpers';

const STEPS = [
    { path: '/shipping', label: 'Shipping' },
    { path: '/confirm', label: 'Review' },
    { path: '/payment', label: 'Payment' },
];

// Wraps the checkout pages: slim header, breadcrumb, the page on the left,
// and the order summary on the right
export default function CheckoutLayout() {
    const { pathname } = useLocation();
    const { cartItems } = useSelector((state) => state.cart);

    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingPrice = 0;
    const total = subtotal + shippingPrice;

    const current = STEPS.findIndex((step) => step.path === pathname);

    return (
        <div className="checkout-page">
            <header className="checkout-header">
                <div className="checkout-header-inner">
                    <Link to="/" className="checkout-logo">
                        OOTD
                    </Link>
                    <IconButton component={Link} to="/cart" aria-label="Back to cart">
                        <Badge badgeContent={count} color="primary">
                            <ShoppingBagOutlinedIcon />
                        </Badge>
                    </IconButton>
                </div>
            </header>

            <div className="checkout-body">
                <main className="checkout-main">
                    <div className="checkout-main-inner">
                        <Breadcrumbs separator="›" className="checkout-crumbs">
                            <Link to="/cart">Cart</Link>
                            {STEPS.map((step, index) => {
                                if (index === current) {
                                    return (
                                        <Typography key={step.path} fontSize="inherit" fontWeight={600} color="text.primary">
                                            {step.label}
                                        </Typography>
                                    );
                                }
                                if (index < current) {
                                    return (
                                        <Link key={step.path} to={step.path}>
                                            {step.label}
                                        </Link>
                                    );
                                }
                                return (
                                    <span key={step.path} className="crumb-muted">
                                        {step.label}
                                    </span>
                                );
                            })}
                        </Breadcrumbs>

                        <Outlet />
                    </div>
                </main>

                <aside className="checkout-side">
                    <div className="checkout-side-inner">
                        {cartItems.map((item) => (
                            <div className="summary-item" key={item.key}>
                                <div className="summary-thumb">
                                    <img src={item.image} alt={item.name} />
                                    <span className="summary-qty">{item.quantity}</span>
                                </div>
                                <div className="summary-item-text">
                                    <span className="summary-item-name">{item.name}</span>
                                    <span className="summary-item-meta">
                                        {item.size} / {item.color}
                                    </span>
                                </div>
                                <span>{peso(item.price * item.quantity)}</span>
                            </div>
                        ))}

                        <div className="summary-totals">
                            <div className="summary-row">
                                <span>
                                    Subtotal · {count} item{count === 1 ? '' : 's'}
                                </span>
                                <span>{peso(subtotal)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span>{shippingPrice === 0 ? 'Free' : peso(shippingPrice)}</span>
                            </div>
                            <div className="summary-row summary-total">
                                <span>Total</span>
                                <span>
                                    <small>PHP</small>
                                    {peso(total)}
                                </span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
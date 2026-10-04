import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Typography } from '@mui/material';

export default function Footer() {
    const { user } = useSelector((state) => state.auth);
    const { cartItems } = useSelector((state) => state.cart);
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <footer className="site-footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <Typography variant="h6" component={Link} to="/" className="brand-link">
                        OOTD
                    </Typography>
                    <p>Outfit of the day, every day. Everyday pieces in the colors you actually want to wear.</p>
                </div>

                <nav className="footer-column" aria-label="Shop">
                    <h3>Shop</h3>
                    <Link to="/">All products</Link>
                    <Link to="/cart">Cart{cartCount > 0 ? ` (${cartCount})` : ''}</Link>
                </nav>

                <nav className="footer-column" aria-label="Account">
                    <h3>Account</h3>
                    {user ? (
                        <>
                            <Link to="/me">My profile</Link>
                            <Link to="/orders/me">My orders</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Login</Link>
                            <Link to="/register">Register</Link>
                        </>
                    )}
                </nav>

                <div className="footer-column">
                    <h3>Ordering</h3>
                    <span>Cash on delivery</span>
                    <span>Order updates by email</span>
                </div>
            </div>

            <div className="footer-bottom">© {new Date().getFullYear()} OOTD. All rights reserved.</div>
        </footer>
    );
}

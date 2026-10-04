import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Typography } from '@mui/material';

// What each kind of visitor sees. Add a new role here to give it its own footer.
// A column has either links ({ to, label }) or plain lines of text.
const getFooterContent = (role, cartCount) => {
    const shop = {
        title: 'Shop',
        links: [
            { to: '/', label: 'All products' },
            { to: '/cart', label: cartCount > 0 ? `Cart (${cartCount})` : 'Cart' },
        ],
    };
    const ordering = { title: 'Ordering', lines: ['Cash on delivery', 'Order updates by email'] };

    switch (role) {
        case 'admin':
            return {
                tagline: 'You are signed in as an admin. Manage the store from the dashboard.',
                badge: 'Admin',
                columns: [
                    {
                        title: 'Manage',
                        links: [
                            { to: '/admin', label: 'Dashboard' },
                            { to: '/admin/products', label: 'Products' },
                            { to: '/admin/product/new', label: 'New product' },
                        ],
                    },
                    {
                        title: 'Customers',
                        links: [
                            { to: '/admin/orders', label: 'Orders' },
                            { to: '/admin/reviews', label: 'Reviews' },
                        ],
                    },
                    {
                        title: 'Account',
                        links: [
                            { to: '/me', label: 'My profile' },
                            { to: '/', label: 'Browse the store' },
                        ],
                    },
                ],
            };

        case 'customer':
            return {
                tagline: 'Outfit of the day, every day. Everyday pieces in the colors you actually want to wear.',
                columns: [
                    shop,
                    {
                        title: 'Account',
                        links: [
                            { to: '/me', label: 'My profile' },
                            { to: '/orders/me', label: 'My orders' },
                        ],
                    },
                    ordering,
                ],
            };

        default: // not logged in
            return {
                tagline: 'Outfit of the day, every day. Everyday pieces in the colors you actually want to wear.',
                columns: [
                    shop,
                    {
                        title: 'Account',
                        links: [
                            { to: '/login', label: 'Login' },
                            { to: '/register', label: 'Register' },
                        ],
                    },
                    ordering,
                ],
            };
    }
};

export default function Footer() {
    const { user } = useSelector((state) => state.auth);
    const { cartItems } = useSelector((state) => state.cart);
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const { tagline, badge, columns } = getFooterContent(user?.role, cartCount);

    return (
        <footer className={badge ? 'site-footer site-footer-admin' : 'site-footer'}>
            <div className="footer-inner" style={{ '--footer-columns': columns.length }}>
                <div className="footer-brand">
                    <Typography variant="h6" component={Link} to="/" className="brand-link">
                        OOTD
                    </Typography>
                    {badge && <span className="footer-badge">{badge}</span>}
                    <p>{tagline}</p>
                </div>

                {columns.map((column) => (
                    <nav className="footer-column" aria-label={column.title} key={column.title}>
                        <h3>{column.title}</h3>
                        {column.links?.map((link) => (
                            <Link to={link.to} key={link.label}>
                                {link.label}
                            </Link>
                        ))}
                        {column.lines?.map((line) => (
                            <span key={line}>{line}</span>
                        ))}
                    </nav>
                ))}
            </div>

            <div className="footer-bottom">© {new Date().getFullYear()} OOTD. All rights reserved.</div>
        </footer>
    );
}

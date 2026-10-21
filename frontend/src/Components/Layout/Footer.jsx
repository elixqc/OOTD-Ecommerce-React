// MP2 · Filters + U2 · UI — storefront footer.
// Renders category links that navigate to /?category=<name> plus the shared support/legal links.
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, IconButton, Link, Stack, Typography } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { CATEGORIES } from '../../constants/productConstants';

// Shop links go straight to the shop with that category already filtered.
// toShop tells the footer not to jump to the top first, because the shop page
// scrolls to the products itself.
const shopColumn = {
    title: 'Shop',
    links: [
        { to: '/?category=All', label: 'All products', toShop: true },
        ...CATEGORIES.map((category) => ({
            to: `/?category=${encodeURIComponent(category)}`,
            label: category,
            toShop: true,
        })),
    ],
};

const supportColumn = {
    title: 'Support',
    links: [
        { to: '/support/contact', label: 'Contact Us' },
        { to: '/support/shipping', label: 'Shipping' },
        { to: '/support/return', label: 'Return' },
        { to: '/support/faq', label: 'FAQ' },
    ],
};

// What each kind of visitor sees. Add a new role here to give it its own footer.
// A column has either links ({ to, label }) or plain lines of text.
const getFooterContent = (role) => {
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
                slogan: 'Own. Outfit. Today.',
                tagline: 'Easy, everyday pieces in the colors you actually want to wear.',
                columns: [
                    shopColumn,
                    {
                        title: 'Account',
                        links: [
                            { to: '/me', label: 'My profile' },
                            { to: '/orders/me', label: 'My orders' },
                            { to: '/reviews/me', label: 'My reviews' },
                            { to: '/wishlist', label: 'My wishlist' },
                            { to: '/cart', label: 'Cart' },
                        ],
                    },
                    supportColumn,
                ],
            };

        default: // not logged in
            return {
                slogan: 'Own. Outfit. Today.',
                tagline: 'Easy, everyday pieces in the colors you actually want to wear.',
                columns: [
                    shopColumn,
                    {
                        title: 'Account',
                        links: [
                            { to: '/login', label: 'Login' },
                            { to: '/register', label: 'Register' },
                            { to: '/cart', label: 'Cart' },
                        ],
                    },
                    supportColumn,
                ],
            };
    }
};

const scrollToTop = () => window.scrollTo(0, 0);

// Round arrow button in the bottom-right corner. Fades in once the page has been scrolled a bit.
function ScrollTopButton() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 300);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <Box
            className={visible ? 'scroll-top scroll-top-visible' : 'scroll-top'}
            sx={{
                position: 'fixed',
                right: { xs: 16, md: 24 },
                bottom: { xs: 16, md: 24 },
                zIndex: 1000,
            }}
        >
            <IconButton
                aria-label="Back to top"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                sx={{
                    width: 48,
                    height: 48,
                    bgcolor: '#000',
                    color: '#fff',
                    '&:hover': { bgcolor: '#333' },
                }}
            >
                <KeyboardArrowUpIcon />
            </IconButton>
        </Box>
    );
}

export default function Footer() {
    const { user } = useSelector((state) => state.auth);

    const { slogan, tagline, badge, columns } = getFooterContent(user?.role);

    return (
        <Box
            component="footer"
            className={badge ? 'site-footer site-footer-admin' : 'site-footer'}
            sx={{ mt: 6, bgcolor: '#f7f7f7', color: '#1a1a1a' }}
        >
            {/* Brand + link columns */}
            <Box
                sx={{
                    display: 'grid',
                    gap: { xs: 4, md: 6 },
                    gridTemplateColumns: {
                        xs: '1fr 1fr',
                        md: `1.6fr repeat(${columns.length}, 1fr)`,
                    },
                    px: { xs: 3, sm: 6, md: 10 },
                    pt: { xs: 5, md: 7 },
                    pb: { xs: 4, md: 6 },
                }}
            >
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <Typography
                            component={RouterLink}
                            to="/"
                            onClick={scrollToTop}
                            sx={{
                                fontSize: { xs: 32, md: 42 },
                                fontWeight: 700,
                                letterSpacing: '6px',
                                lineHeight: 1,
                                color: '#1a1a1a',
                                textDecoration: 'none',
                            }}
                        >
                            OOTD
                            <Box component="span" sx={{ color: 'secondary.main' }}>
                                .
                            </Box>
                        </Typography>
                        {badge && <span className="footer-badge">{badge}</span>}
                    </Stack>
                    {slogan && (
                        <Typography
                            sx={{
                                mt: 2.5,
                                fontSize: 20,
                                fontWeight: 700,
                                letterSpacing: '1.5px',
                                color: '#1a1a1a',
                            }}
                        >
                            {slogan}
                        </Typography>
                    )}
                    <Typography
                        sx={{
                            mt: slogan ? 1 : 2,
                            maxWidth: 300,
                            fontSize: 14,
                            lineHeight: 1.6,
                            color: '#666',
                        }}
                    >
                        {tagline}
                    </Typography>
                </Box>

                {columns.map((column) => (
                    <Box component="nav" aria-label={column.title} key={column.title}>
                        <Typography
                            component="h3"
                            sx={{ mb: 2, fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}
                        >
                            {column.title}
                        </Typography>
                        <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                            {column.links?.map((link) => (
                                <Link
                                    key={link.label}
                                    component={RouterLink}
                                    to={link.to}
                                    onClick={link.toShop ? undefined : scrollToTop}
                                    underline="none"
                                    className="footer-link"
                                    sx={{ fontSize: 14, color: '#666' }}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {column.lines?.map((line) => (
                                <Typography key={line} sx={{ fontSize: 14, color: '#666' }}>
                                    {line}
                                </Typography>
                            ))}
                        </Stack>
                    </Box>
                ))}
            </Box>

            {/* Bottom bar */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 1.5,
                    px: { xs: 3, sm: 6, md: 10 },
                    py: 2,
                    borderTop: '1px solid #e6e6e6',
                    fontSize: 13,
                    color: '#666',
                }}
            >
                <span>© {new Date().getFullYear()} OOTD. All rights reserved.</span>
                <Stack direction="row" spacing={3}>
                    <Link
                        component={RouterLink}
                        to="/terms"
                        onClick={scrollToTop}
                        underline="none"
                        className="footer-link"
                        sx={{ fontSize: 13, color: '#666' }}
                    >
                        Terms of Service
                    </Link>
                    <Link
                        component={RouterLink}
                        to="/privacy"
                        onClick={scrollToTop}
                        underline="none"
                        className="footer-link"
                        sx={{ fontSize: 13, color: '#666' }}
                    >
                        Privacy Policy
                    </Link>
                </Stack>
            </Box>

            <ScrollTopButton />
        </Box>
    );
}

// U2 · UI — admin shell.
// Sidebar + content frame for every /admin route; links to dashboard, products, orders, users and reviews.
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IconButton, Tooltip } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { getProcessingCount } from '../../actions/orderActions';

const STORAGE_KEY = 'adminSidebarCollapsed';

const MENU = [
    { to: '/admin', label: 'Dashboard', icon: <DashboardOutlinedIcon />, end: true },
    { to: '/admin/products', label: 'Products', icon: <Inventory2OutlinedIcon />, end: true },
    {
        to: '/admin/orders',
        label: 'Orders',
        icon: <ShoppingCartOutlinedIcon />,
        badge: 'processing',
    },
    { to: '/admin/users', label: 'Users', icon: <PeopleOutlinedIcon /> },
    { to: '/admin/reviews', label: 'Reviews', icon: <RateReviewOutlinedIcon /> },
];

// Remembers the choice; on small screens it starts collapsed
const readCollapsed = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) return saved === 'true';
    } catch {
        // storage blocked, fall through to the default
    }
    return window.innerWidth < 900;
};

export default function AdminLayout() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const processing = useSelector((state) => state.adminOrders.processingCount);
    const [collapsed, setCollapsed] = useState(readCollapsed);

    const { pathname } = useLocation();

    // Orders still in Processing; refreshed on every page change so it updates
    // after the admin handles one
    useEffect(() => {
        dispatch(getProcessingCount());
    }, [dispatch, pathname]);

    const badges = { processing };

    const toggle = () => {
        const next = !collapsed;
        setCollapsed(next);
        try {
            localStorage.setItem(STORAGE_KEY, String(next));
        } catch {
            // storage blocked, the choice just won't be remembered
        }
    };

    return (
        <div className="admin-shell">
            <div className={`admin-side-wrap${collapsed ? ' collapsed' : ''}`}>
                <aside className="admin-side">
                    <Link to="/admin" className="admin-side-brand">
                        <span className="admin-side-logo">O</span>
                        <span className="admin-side-text">OOTD Admin</span>
                    </Link>

                    <p className="admin-side-label admin-side-text">Main menu</p>
                    <nav className="admin-side-nav">
                        {MENU.map((item) => {
                            const count = item.badge ? badges[item.badge] : 0;
                            return (
                                <Tooltip
                                    key={item.to}
                                    title={collapsed ? item.label : ''}
                                    placement="right"
                                    arrow
                                >
                                    <NavLink to={item.to} end={item.end}>
                                        {item.icon}
                                        <span className="admin-side-text">{item.label}</span>
                                        {count > 0 && (
                                            <span className="admin-side-badge">
                                                {count > 99 ? '99+' : count}
                                            </span>
                                        )}
                                    </NavLink>
                                </Tooltip>
                            );
                        })}
                    </nav>

                    <p className="admin-side-label admin-side-text">Store</p>
                    <nav className="admin-side-nav">
                        <Tooltip title={collapsed ? 'Back to store' : ''} placement="right" arrow>
                            <Link to="/">
                                <StorefrontOutlinedIcon />
                                <span className="admin-side-text">Back to store</span>
                            </Link>
                        </Tooltip>
                    </nav>
                </aside>

                <IconButton
                    className="admin-side-toggle"
                    size="small"
                    onClick={toggle}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-expanded={!collapsed}
                >
                    <ChevronLeftRoundedIcon fontSize="small" />
                </IconButton>
            </div>

            <div className="admin-content">
                <main className="admin-main">
                    <Outlet />
                </main>
                <footer className="admin-footer">
                    <span>OOTD Admin · © {new Date().getFullYear()}</span>
                    <span>
                        Signed in as {user?.name} · <Link to="/">Back to store</Link>
                    </span>
                </footer>
            </div>
        </div>
    );
}

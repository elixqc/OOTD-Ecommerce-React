import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, Button, IconButton, Tooltip, Typography } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { logout } from '../../actions/userActions';

const STORAGE_KEY = 'adminSidebarCollapsed';

const MENU = [
    { to: '/admin', label: 'Dashboard', icon: <DashboardOutlinedIcon />, end: true },
    { to: '/admin/products', label: 'Products', icon: <Inventory2OutlinedIcon />, end: true },
    { to: '/admin/orders', label: 'Orders', icon: <ShoppingCartOutlinedIcon /> },
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
    const [collapsed, setCollapsed] = useState(readCollapsed);

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
                        {MENU.map((item) => (
                            <Tooltip key={item.to} title={collapsed ? item.label : ''} placement="right" arrow>
                                <NavLink to={item.to} end={item.end}>
                                    {item.icon}
                                    <span className="admin-side-text">{item.label}</span>
                                </NavLink>
                            </Tooltip>
                        ))}
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

                    <div className="admin-side-footer">
                        <div className="admin-side-user">
                            <Avatar src={user?.avatar?.url || undefined} alt={user?.name} sx={{ width: 36, height: 36 }}>
                                {user?.name?.[0]}
                            </Avatar>
                            <Typography variant="body2" noWrap className="admin-side-text" sx={{ fontWeight: 600 }}>
                                {user?.name}
                            </Typography>
                        </div>
                        <Tooltip title={collapsed ? 'Logout' : ''} placement="right" arrow>
                            <Button
                                color="inherit"
                                size="small"
                                startIcon={<LogoutOutlinedIcon />}
                                onClick={() => dispatch(logout())}
                                sx={{ justifyContent: 'flex-start', color: '#6b7280' }}
                            >
                                <span className="admin-side-text">Logout</span>
                            </Button>
                        </Tooltip>
                    </div>
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
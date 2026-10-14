import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    AppBar,
    Avatar,
    Badge,
    Box,
    Button,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Skeleton,
    Toolbar,
    Typography,
    useScrollTrigger,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import { logout } from '../../actions/userActions';
import { notifySuccess } from '../../Utils/helpers';

// Small uppercase links, thin underline on the current page
const navTextSx = {
    color: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    minWidth: 0,
    px: 1.25,
    '&:hover': { bgcolor: 'transparent', opacity: 0.6 },
    '&.active': {
        textDecoration: 'underline',
        textDecorationThickness: '1px',
        textUnderlineOffset: '8px',
    },
};

export default function Header() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { user, loading } = useSelector((state) => state.auth);
    const { cartItems } = useSelector((state) => state.cart);
    const isAdmin = user?.role === 'admin';
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const wide = pathname === '/'; // same rule as CustomerLayout
    const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 0 });

    const [anchorEl, setAnchorEl] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const closeMenu = () => setAnchorEl(null);
    const closeDrawer = () => setDrawerOpen(false);

    const handleLogout = async () => {
        closeMenu();
        closeDrawer();
        await dispatch(logout());
        notifySuccess('Logged out');
        navigate('/');
    };

    const navLinks = [
        { to: '/', label: 'Shop', icon: <StorefrontOutlinedIcon />, end: true },
        ...(user && !isAdmin ? [{ to: '/orders/me', label: 'My orders', icon: <ReceiptLongOutlinedIcon /> }] : []),
        ...(isAdmin ? [{ to: '/admin', label: 'Admin dashboard', icon: <DashboardOutlinedIcon /> }] : []),
    ];

    const initial = user?.name?.charAt(0).toUpperCase();

    return (
        <>
            <AppBar
                position="sticky"
                color="transparent"
                elevation={0}
                sx={{
                    color: 'primary.main',
                    bgcolor: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
                    backdropFilter: scrolled ? 'blur(8px)' : 'none',
                    borderBottom: '1px solid',
                    borderColor: scrolled ? '#ececec' : 'transparent',
                    transition: 'background-color 0.25s, border-color 0.25s',
                }}
            >
                <Toolbar
                    disableGutters
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto 1fr',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: wide ? 'none' : 'var(--page-max)',
                        mx: 'auto',
                        px: 'var(--page-gutter)',
                        minHeight: { xs: 56, md: 64 },
                    }}
                >
                    {/* Left: hamburger on mobile, links on desktop */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                            color="inherit"
                            edge="start"
                            aria-label="Open menu"
                            onClick={() => setDrawerOpen(true)}
                            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
                            {navLinks.map((link) => (
                                <Button
                                    key={link.to}
                                    component={NavLink}
                                    to={link.to}
                                    end={link.end}
                                    disableRipple
                                    sx={navTextSx}
                                >
                                    {link.label}
                                </Button>
                            ))}
                        </Box>
                    </Box>

                    {/* Center: brand */}
                    <Typography
                        variant="h5"
                        component={Link}
                        to="/"
                        className="brand-link"
                        sx={{ fontWeight: 800, fontSize: { xs: 20, md: 24 } }}
                    >
                        OOTD
                        <Box component="span" sx={{ color: 'secondary.main' }}>
                            .
                        </Box>
                    </Typography>

                    {/* Right: cart and account */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        {!isAdmin && (
                            <IconButton color="inherit" component={Link} to="/cart" aria-label="Shopping cart">
                                <Badge badgeContent={cartCount} max={99} color="secondary">
                                    <ShoppingBagOutlinedIcon />
                                </Badge>
                            </IconButton>
                        )}

                        {loading ? (
                            <Skeleton variant="circular" width={30} height={30} sx={{ ml: 1 }} />
                        ) : user ? (
                            <>
                                <IconButton
                                    onClick={(e) => setAnchorEl(e.currentTarget)}
                                    size="small"
                                    aria-label="Account menu"
                                    sx={{ ml: 0.5 }}
                                >
                                    <Avatar
                                        src={user.avatar?.url || undefined}
                                        alt={user.name}
                                        sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: 14 }}
                                    >
                                        {initial}
                                    </Avatar>
                                </IconButton>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={closeMenu}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                    slotProps={{ paper: { sx: { mt: 1, minWidth: 220 } } }}
                                >
                                    <Box sx={{ px: 2, py: 1 }}>
                                        <Typography fontWeight={700} noWrap>
                                            {user.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" noWrap>
                                            {user.email}
                                        </Typography>
                                    </Box>
                                    <Divider />
                                    <MenuItem component={Link} to="/me" onClick={closeMenu}>
                                        <ListItemIcon>
                                            <PersonOutlinedIcon fontSize="small" />
                                        </ListItemIcon>
                                        My profile
                                    </MenuItem>
                                    <MenuItem component={Link} to="/me/update" onClick={closeMenu}>
                                        <ListItemIcon>
                                            <ManageAccountsOutlinedIcon fontSize="small" />
                                        </ListItemIcon>
                                        Edit profile
                                    </MenuItem>
                                    <MenuItem component={Link} to="/password/update" onClick={closeMenu}>
                                        <ListItemIcon>
                                            <LockOutlinedIcon fontSize="small" />
                                        </ListItemIcon>
                                        Change password
                                    </MenuItem>
                                    {!isAdmin && (
                                        <MenuItem component={Link} to="/orders/me" onClick={closeMenu}>
                                            <ListItemIcon>
                                                <ReceiptLongOutlinedIcon fontSize="small" />
                                            </ListItemIcon>
                                            My orders
                                        </MenuItem>
                                    )}
                                    {isAdmin && (
                                        <MenuItem component={Link} to="/admin" onClick={closeMenu}>
                                            <ListItemIcon>
                                                <DashboardOutlinedIcon fontSize="small" />
                                            </ListItemIcon>
                                            Admin dashboard
                                        </MenuItem>
                                    )}
                                    <Divider />
                                    <MenuItem onClick={handleLogout}>
                                        <ListItemIcon>
                                            <LogoutOutlinedIcon fontSize="small" />
                                        </ListItemIcon>
                                        Logout
                                    </MenuItem>
                                </Menu>
                            </>
                        ) : (
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
                                <Button component={Link} to="/login" disableRipple sx={navTextSx}>
                                    Login
                                </Button>
                                <Button component={Link} to="/register" disableRipple sx={navTextSx}>
                                    Register
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Mobile drawer */}
            <Drawer anchor="left" open={drawerOpen} onClose={closeDrawer}>
                <Box sx={{ width: 280 }} role="presentation">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
                        <Typography variant="h6" className="brand-link" sx={{ fontWeight: 800 }}>
                            OOTD
                            <Box component="span" sx={{ color: 'secondary.main' }}>
                                .
                            </Box>
                        </Typography>
                        <IconButton onClick={closeDrawer} aria-label="Close menu">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Divider />

                    <List>
                        {navLinks.map((link) => (
                            <ListItemButton
                                key={link.to}
                                component={NavLink}
                                to={link.to}
                                end={link.end}
                                onClick={closeDrawer}
                                sx={{ '&.active': { bgcolor: 'action.selected', fontWeight: 700 } }}
                            >
                                <ListItemIcon>{link.icon}</ListItemIcon>
                                <ListItemText primary={link.label} />
                            </ListItemButton>
                        ))}
                    </List>
                    <Divider />

                    <List>
                        {user ? (
                            <>
                                <ListItemButton component={Link} to="/me" onClick={closeDrawer}>
                                    <ListItemIcon>
                                        <PersonOutlinedIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="My profile" secondary={user.name} />
                                </ListItemButton>
                                <ListItemButton onClick={handleLogout}>
                                    <ListItemIcon>
                                        <LogoutOutlinedIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Logout" />
                                </ListItemButton>
                            </>
                        ) : (
                            <>
                                <ListItemButton component={Link} to="/login" onClick={closeDrawer}>
                                    <ListItemIcon>
                                        <LoginOutlinedIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Login" />
                                </ListItemButton>
                                <ListItemButton component={Link} to="/register" onClick={closeDrawer}>
                                    <ListItemIcon>
                                        <PersonAddAltOutlinedIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Register" />
                                </ListItemButton>
                            </>
                        )}
                    </List>
                </Box>
            </Drawer>
        </>
    );
}
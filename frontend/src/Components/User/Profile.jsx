// Q4 · Clerk login + U1-B · Validation — account overview.
// Shows the signed-in user, links to updates/orders/wishlist/reviews and adds the admin dashboard link.
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Avatar,
    Button,
    Card,
    Chip,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Skeleton,
    Typography,
} from '@mui/material';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { formatDate } from '../../Utils/helpers';

// One labelled line: icon, small label, then the value (or a muted placeholder)
function InfoRow({ icon, label, value }) {
    return (
        <div className="profile-row">
            <span className="profile-row-icon">{icon}</span>
            <div className="profile-row-text">
                <Typography variant="caption" className="profile-row-label">
                    {label}
                </Typography>
                <Typography className={value ? 'profile-row-value' : 'profile-row-value empty'}>
                    {value || 'Not added yet'}
                </Typography>
            </div>
        </div>
    );
}

// Placeholder row shaped like InfoRow: icon tile, small label, value
function RowSkeleton() {
    return (
        <div className="profile-row">
            <Skeleton
                variant="rounded"
                animation="wave"
                width={40}
                height={40}
                className="profile-row-skeleton-icon"
            />
            <div className="profile-row-text profile-row-skeleton-text">
                <Skeleton variant="text" animation="wave" width={70} sx={{ fontSize: '0.75rem' }} />
                <Skeleton variant="text" animation="wave" width="60%" />
            </div>
        </div>
    );
}

// Placeholder that mirrors the real page layout while the profile loads
function ProfileSkeleton() {
    return (
        <div className="profile-page" aria-busy="true" aria-label="Loading profile">
            <Card elevation={0} className="profile-hero">
                <Skeleton
                    variant="rectangular"
                    animation="wave"
                    className="profile-banner-skeleton"
                />
                <div className="profile-hero-body">
                    <Skeleton
                        variant="circular"
                        animation="wave"
                        className="profile-avatar-skeleton"
                    />
                    <div className="profile-hero-info">
                        <Skeleton
                            variant="text"
                            animation="wave"
                            width={200}
                            sx={{ fontSize: '1.5rem' }}
                        />
                        <Skeleton variant="text" animation="wave" width={150} />
                        <div className="profile-meta">
                            <Skeleton
                                variant="rounded"
                                animation="wave"
                                width={72}
                                height={24}
                                sx={{ borderRadius: 99 }}
                            />
                            <Skeleton variant="text" animation="wave" width={130} />
                        </div>
                    </div>
                    <Skeleton
                        variant="rounded"
                        animation="wave"
                        width={140}
                        height={36}
                        sx={{ borderRadius: 99 }}
                    />
                </div>
            </Card>

            <div className="profile-grid">
                <div className="profile-col">
                    <Card elevation={0} className="profile-panel">
                        <Skeleton
                            variant="text"
                            animation="wave"
                            width={160}
                            className="profile-panel-title-skeleton"
                        />
                        <RowSkeleton />
                        <RowSkeleton />
                        <RowSkeleton />
                    </Card>

                    <Card elevation={0} className="profile-panel">
                        <Skeleton
                            variant="text"
                            animation="wave"
                            width={140}
                            className="profile-panel-title-skeleton"
                        />
                        <RowSkeleton />
                    </Card>
                </div>

                <Card elevation={0} className="profile-panel">
                    <Skeleton
                        variant="text"
                        animation="wave"
                        width={90}
                        className="profile-panel-title-skeleton"
                    />
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="profile-row profile-row-skeleton-link">
                            <Skeleton variant="rounded" animation="wave" width={28} height={28} />
                            <div className="profile-row-text profile-row-skeleton-text">
                                <Skeleton variant="text" animation="wave" width="55%" />
                                <Skeleton
                                    variant="text"
                                    animation="wave"
                                    width="80%"
                                    sx={{ fontSize: '0.8rem' }}
                                />
                            </div>
                        </div>
                    ))}
                </Card>
            </div>
        </div>
    );
}

export default function Profile() {
    const { user, loading } = useSelector((state) => state.auth);
    const location = useLocation();

    // Skeleton only while the session is being restored
    if (loading) {
        return <ProfileSkeleton />;
    }

    // Not logged in: send to the login form, same as ProtectedRoute does
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const address = user.shippingAddress || {};
    const cityLine = [address.city, address.region].filter(Boolean).join(', ');
    const hasAddress = [address.address, cityLine, address.postalCode, address.country].some(
        Boolean,
    );

    const links = [
        {
            to: '/me/update',
            label: 'Edit profile',
            hint: 'Update your details and photo',
            icon: <EditOutlinedIcon />,
        },
        {
            to: '/password/update',
            label: 'Change password',
            hint: 'Keep your account secure',
            icon: <LockOutlinedIcon />,
        },
        {
            to: '/orders/me',
            label: 'My orders',
            hint: 'Track and review your purchases',
            icon: <ReceiptLongOutlinedIcon />,
        },
    ];
    if (user.role === 'admin') {
        links.push({
            to: '/admin',
            label: 'Admin dashboard',
            hint: 'Manage the store',
            icon: <DashboardOutlinedIcon />,
        });
    }

    return (
        <div className="profile-page page-enter">
            <Card elevation={0} className="profile-hero">
                <div className="profile-banner" />
                <div className="profile-hero-body">
                    <Avatar
                        src={user.avatar?.url || undefined}
                        alt={user.name}
                        className="profile-avatar"
                    >
                        {user.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <div className="profile-hero-info">
                        <Typography variant="h5" component="h1" className="profile-name">
                            {user.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {user.email}
                        </Typography>
                        <div className="profile-meta">
                            <Chip
                                size="small"
                                variant="outlined"
                                label={user.role === 'admin' ? 'Admin' : 'Customer'}
                            />
                            <Typography variant="body2" color="text.secondary">
                                Member since {formatDate(user.createdAt)}
                            </Typography>
                        </div>
                    </div>
                    <Button
                        variant="contained"
                        component={Link}
                        to="/me/update"
                        startIcon={<EditOutlinedIcon />}
                        className="profile-edit-btn"
                    >
                        Edit profile
                    </Button>
                </div>
            </Card>

            <div className="profile-grid">
                <div className="profile-col">
                    <Card elevation={0} className="profile-panel">
                        <Typography component="h2" className="profile-panel-title">
                            Personal information
                        </Typography>
                        <InfoRow icon={<BadgeOutlinedIcon />} label="Full name" value={user.name} />
                        <InfoRow icon={<EmailOutlinedIcon />} label="Email" value={user.email} />
                        <InfoRow icon={<PhoneOutlinedIcon />} label="Phone" value={user.phone} />
                    </Card>

                    <Card elevation={0} className="profile-panel">
                        <Typography component="h2" className="profile-panel-title">
                            Shipping address
                        </Typography>
                        {hasAddress ? (
                            <div className="profile-row">
                                <span className="profile-row-icon">
                                    <LocationOnOutlinedIcon />
                                </span>
                                <address className="profile-address">
                                    {[
                                        address.address,
                                        cityLine,
                                        address.postalCode,
                                        address.country,
                                    ]
                                        .filter(Boolean)
                                        .map((line) => (
                                            <span key={line}>{line}</span>
                                        ))}
                                </address>
                            </div>
                        ) : (
                            <div className="profile-empty">
                                <Typography color="text.secondary">
                                    You haven&apos;t added a shipping address yet.
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    component={Link}
                                    to="/me/update"
                                >
                                    Add address
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>

                <Card elevation={0} className="profile-panel profile-links">
                    <Typography component="h2" className="profile-panel-title">
                        Account
                    </Typography>
                    <List disablePadding>
                        {links.map((item) => (
                            <ListItemButton
                                key={item.to}
                                component={Link}
                                to={item.to}
                                className="profile-link"
                            >
                                <ListItemIcon className="profile-link-icon">
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.label} secondary={item.hint} />
                                <ChevronRightRoundedIcon
                                    fontSize="small"
                                    className="profile-link-chevron"
                                />
                            </ListItemButton>
                        ))}
                    </List>
                </Card>
            </div>
        </div>
    );
}

import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Avatar, Button, Card, Chip, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
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
                <Typography className={value ? 'profile-row-value' : 'profile-row-value empty'}>{value || 'Not added yet'}</Typography>
            </div>
        </div>
    );
}

export default function Profile() {
    const { user } = useSelector((state) => state.auth);
    const address = user.shippingAddress || {};
    const cityLine = [address.city, address.region].filter(Boolean).join(', ');
    const hasAddress = [address.address, cityLine, address.postalCode, address.country].some(Boolean);

    const links = [
        { to: '/me/update', label: 'Edit profile', hint: 'Update your details and photo', icon: <EditOutlinedIcon /> },
        { to: '/password/update', label: 'Change password', hint: 'Keep your account secure', icon: <LockOutlinedIcon /> },
        { to: '/orders/me', label: 'My orders', hint: 'Track and review your purchases', icon: <ReceiptLongOutlinedIcon /> },
    ];
    if (user.role === 'admin') {
        links.push({ to: '/admin', label: 'Admin dashboard', hint: 'Manage the store', icon: <DashboardOutlinedIcon /> });
    }

    return (
        <div className="profile-page">
            <Card elevation={0} className="profile-hero">
                <div className="profile-banner" />
                <div className="profile-hero-body">
                    <Avatar src={user.avatar?.url || undefined} alt={user.name} className="profile-avatar">
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
                            <Chip size="small" variant="outlined" label={user.role === 'admin' ? 'Admin' : 'Customer'} />
                            <Typography variant="body2" color="text.secondary">
                                Member since {formatDate(user.createdAt)}
                            </Typography>
                        </div>
                    </div>
                    <Button variant="contained" component={Link} to="/me/update" startIcon={<EditOutlinedIcon />} className="profile-edit-btn">
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
                                    {[address.address, cityLine, address.postalCode, address.country].filter(Boolean).map((line) => (
                                        <span key={line}>{line}</span>
                                    ))}
                                </address>
                            </div>
                        ) : (
                            <div className="profile-empty">
                                <Typography color="text.secondary">You haven&apos;t added a shipping address yet.</Typography>
                                <Button variant="outlined" size="small" component={Link} to="/me/update">
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
                            <ListItemButton key={item.to} component={Link} to={item.to} className="profile-link">
                                <ListItemIcon className="profile-link-icon">{item.icon}</ListItemIcon>
                                <ListItemText primary={item.label} secondary={item.hint} />
                                <ChevronRightRoundedIcon fontSize="small" className="profile-link-chevron" />
                            </ListItemButton>
                        ))}
                    </List>
                </Card>
            </div>
        </div>
    );
}
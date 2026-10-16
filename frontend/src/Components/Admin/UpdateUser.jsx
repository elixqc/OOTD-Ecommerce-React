import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Avatar, Box, Button, Chip, IconButton, Skeleton, Tooltip, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { clearErrors, getUserDetails, updateUser } from '../../actions/userActions';
import { UPDATE_USER_RESET } from '../../constants/userConstants';
import { formatDate, notifyError, notifySuccess, peso, shortOrderId } from '../../Utils/helpers';
import ConfirmDialog from '../Layout/ConfirmDialog';

// Same palette as the dashboard, products and orders pages
const NEUTRAL = '#8a8f98';
const BORDER = '#eceef2';
const STATUS_COLORS = { Processing: 'warning', Shipped: 'info', Delivered: 'success', Cancelled: 'error' };

const cardSx = { border: `1px solid ${BORDER}`, borderRadius: '16px', bgcolor: '#fff', p: 3 };

// "Blue Hoodie +2 more", same wording as the orders list
const itemSummary = (order) => {
    const items = order.orderItems || [];
    if (items.length === 0) return '—';
    return items.length > 1 ? `${items[0].name} +${items.length - 1} more` : items[0].name;
};

function SummaryRow({ label, children, bold }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, py: 0.75 }}>
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body2" component="div" sx={{ fontWeight: bold ? 700 : 500, fontSize: bold ? '1rem' : undefined }}>
                {children}
            </Typography>
        </Box>
    );
}

// An icon next to one line of contact info
function InfoRow({ icon, children, muted }) {
    return (
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 1.25, '&:last-of-type': { mb: 0 } }}>
            <Box sx={{ color: NEUTRAL, display: 'flex', mt: '2px' }}>{icon}</Box>
            <Typography variant="body2" sx={{ color: muted ? NEUTRAL : undefined, wordBreak: 'break-word' }}>
                {children}
            </Typography>
        </Box>
    );
}

export default function UpdateUser() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const [confirm, setConfirm] = useState({ open: false });
    const closeConfirm = () => setConfirm((current) => ({ ...current, open: false }));
    const { user, orderCount, totalSpent, recentOrders, loading, error } = useSelector((state) => state.userDetails);
    const { loading: updating, isUpdated, updatedUser, error: updateError } = useSelector((state) => state.adminUser);

    useEffect(() => {
        dispatch(getUserDetails(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (error) {
            notifyError(error);
            dispatch(clearErrors());
        }
        if (updateError) {
            notifyError(updateError);
            dispatch(clearErrors());
        }
    }, [error, updateError, dispatch]);

    useEffect(() => {
        if (isUpdated) {
            notifySuccess(updatedUser?.isActive ? 'Account activated' : 'Account deactivated');
            dispatch({ type: UPDATE_USER_RESET });
            dispatch(getUserDetails(id));
        }
    }, [isUpdated, updatedUser, id, dispatch]);

    // The store can still hold a different user for one render
    const ready = user && user._id === id;

    if (!ready) {
        if (loading || loading === undefined) {
            return (
                <>
                    <Skeleton width={260} height={40} sx={{ mb: 3 }} />
                    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1.8fr) minmax(300px,1fr)' } }}>
                        <Skeleton variant="rounded" height={320} sx={{ borderRadius: '16px' }} />
                        <Skeleton variant="rounded" height={320} sx={{ borderRadius: '16px' }} />
                    </Box>
                </>
            );
        }
        return (
            <Box sx={{ minHeight: 300, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <Box>
                    <PersonOutlineRoundedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                    <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        {error || 'User not found'}
                    </Typography>
                    <Button size="small" component={Link} to="/admin/users" sx={{ mt: 1 }}>
                        Back to users
                    </Button>
                </Box>
            </Box>
        );
    }

    const address = user.shippingAddress || {};
    const streetLine = address.address;
    const areaLine = [address.city, address.region, address.postalCode, address.country].filter(Boolean).join(', ');
    const isAdmin = user.role === 'admin';
    const orders = recentOrders || [];
    // Admins don't shop, so skip the order sections unless they really placed an order
    const showOrders = !isAdmin || orderCount > 0;

    const handleToggle = () => {
        const deactivating = user.isActive;
        setConfirm({
            open: true,
            title: deactivating ? 'Deactivate this account?' : 'Activate this account?',
            text: deactivating
                ? `${user.name} won't be able to log in or use their account until you activate it again.`
                : `${user.name} will be able to log in again.`,
            confirmText: deactivating ? 'Yes, deactivate' : 'Yes, activate',
            onConfirm: () => dispatch(updateUser(user._id, !deactivating)),
        });
    };

    return (
        <>
            {/* Title and status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Tooltip title="Back to users">
                    <IconButton component={Link} to="/admin/users" aria-label="Back to users" sx={{ border: `1px solid ${BORDER}`, bgcolor: '#fff' }}>
                        <ArrowBackRoundedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                            {user.name}
                        </Typography>
                        <Chip size="small" variant="outlined" label={user.isActive ? 'Active' : 'Deactivated'} color={user.isActive ? 'success' : 'default'} />
                        {isAdmin && <Chip size="small" variant="outlined" label="Admin" color="primary" />}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Joined on {formatDate(user.createdAt)}
                        {showOrders && ` · ${orderCount} order${orderCount === 1 ? '' : 's'}`}
                    </Typography>
                </Box>
            </Box>

            {!user.isActive && (
                <Alert severity="warning" variant="outlined" sx={{ borderRadius: '12px', mb: 3 }}>
                    This account is deactivated. {user.name} can&apos;t log in until you activate it again.
                </Alert>
            )}

            <Box sx={{ display: 'grid', gap: 3, alignItems: 'start', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1.8fr) minmax(300px,1fr)' } }}>
                {/* Left: profile and recent orders */}
                <Box sx={{ display: 'grid', gap: 3, minWidth: 0 }}>
                    <Box sx={cardSx}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
                            Profile
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                            <Avatar
                                src={user.avatar?.url || undefined}
                                alt={user.name}
                                sx={{ width: 64, height: 64, bgcolor: '#eceef2', color: 'var(--brand-dark)', fontWeight: 700, fontSize: '1.5rem' }}
                            >
                                {user.name?.[0]?.toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 600 }} noWrap>
                                    {user.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: NEUTRAL }} noWrap>
                                    {isAdmin ? 'Administrator' : 'Customer'}
                                </Typography>
                            </Box>
                        </Box>
                        <InfoRow icon={<EmailOutlinedIcon fontSize="small" />}>{user.email}</InfoRow>
                        <InfoRow icon={<PhoneOutlinedIcon fontSize="small" />} muted={!user.phone}>
                            {user.phone || 'No phone number added'}
                        </InfoRow>
                        <InfoRow icon={<LocationOnOutlinedIcon fontSize="small" />} muted={!streetLine && !areaLine}>
                            {streetLine || areaLine ? (
                                <>
                                    {streetLine}
                                    {streetLine && areaLine && <br />}
                                    {areaLine}
                                </>
                            ) : (
                                'No shipping address added'
                            )}
                        </InfoRow>
                    </Box>

                    {showOrders && (
                        <Box sx={cardSx}>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                                <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                                    Recent orders
                                </Typography>
                                {orderCount > orders.length && (
                                    <Typography variant="caption" sx={{ color: NEUTRAL }}>
                                        Latest {orders.length} of {orderCount}
                                    </Typography>
                                )}
                            </Box>
                            {orders.length === 0 ? (
                                <Box sx={{ py: 3, textAlign: 'center' }}>
                                    <ReceiptLongOutlinedIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        No orders yet
                                    </Typography>
                                </Box>
                            ) : (
                                orders.map((order) => (
                                    <Box
                                        key={order._id}
                                        sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: '1px solid #f0f1f4', '&:last-of-type': { borderBottom: 0, pb: 0 } }}
                                    >
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Link to={`/admin/order/${order._id}`} className="dash-order-link" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                                {shortOrderId(order._id)}
                                            </Link>
                                            <Typography variant="caption" noWrap component="p" sx={{ color: NEUTRAL }}>
                                                {itemSummary(order)} · {formatDate(order.createdAt)}
                                            </Typography>
                                        </Box>
                                        <Chip size="small" variant="outlined" label={order.orderStatus} color={STATUS_COLORS[order.orderStatus] ?? 'default'} />
                                        <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', minWidth: 80, textAlign: 'right' }}>
                                            {peso(order.totalPrice)}
                                        </Typography>
                                    </Box>
                                ))
                            )}
                        </Box>
                    )}
                </Box>

                {/* Right: account action and summary (shown first on small screens) */}
                <Box sx={{ display: 'grid', gap: 3, minWidth: 0, order: { xs: -1, lg: 0 } }}>
                    <Box sx={cardSx}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                            Account access
                        </Typography>
                        {isAdmin ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Admin accounts can&apos;t be deactivated here.
                            </Typography>
                        ) : (
                            <>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                                    {user.isActive
                                        ? 'This account is active and can log in and place orders.'
                                        : 'This account is deactivated and can’t log in.'}
                                </Typography>
                                <Button
                                    fullWidth
                                    disableElevation
                                    variant={user.isActive ? 'outlined' : 'contained'}
                                    color={user.isActive ? 'error' : 'primary'}
                                    startIcon={user.isActive ? <BlockOutlinedIcon /> : <CheckCircleOutlinedIcon />}
                                    disabled={updating}
                                    onClick={handleToggle}
                                    sx={{ borderRadius: 99, height: 42 }}
                                >
                                    {updating ? 'Saving...' : user.isActive ? 'Deactivate account' : 'Activate account'}
                                </Button>
                                <Typography variant="caption" component="p" sx={{ color: NEUTRAL, mt: 2 }}>
                                    Deactivating signs the user out and blocks new logins. Their orders and data are kept.
                                </Typography>
                            </>
                        )}
                    </Box>

                    <Box sx={cardSx}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
                            Account summary
                        </Typography>
                        <SummaryRow label="Role">{isAdmin ? 'Admin' : 'Customer'}</SummaryRow>
                        <SummaryRow label="Status">
                            <Chip size="small" variant="outlined" label={user.isActive ? 'Active' : 'Deactivated'} color={user.isActive ? 'success' : 'default'} />
                        </SummaryRow>
                        <SummaryRow label="Joined">{formatDate(user.createdAt)}</SummaryRow>
                        {showOrders && (
                            <>
                                <Box sx={{ borderTop: '1px solid #f0f1f4', mt: 1, pt: 1 }}>
                                    <SummaryRow label="Orders">{orderCount}</SummaryRow>
                                    <SummaryRow label="Total spent" bold>
                                        {peso(totalSpent || 0)}
                                    </SummaryRow>
                                </Box>
                                <Typography variant="caption" component="p" sx={{ color: NEUTRAL, mt: 1 }}>
                                    Total spent doesn&apos;t include cancelled orders.
                                </Typography>
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
            <ConfirmDialog {...confirm} onClose={closeConfirm} />
        </>
    );
}
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    IconButton,
    Skeleton,
    Step,
    StepLabel,
    Stepper,
    Tooltip,
    Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { downloadReceipt, getOrderDetails, updateOrder } from '../../actions/orderActions';
import { clearErrors } from '../../actions/userActions';
import { NEXT_ORDER_STATUSES, UPDATE_ORDER_RESET } from '../../constants/orderConstants';
import { formatDate, notifyError, notifySuccess, peso, shortOrderId } from '../../Utils/helpers';
import ConfirmDialog from '../Layout/ConfirmDialog';

// Same palette as the dashboard, products and orders pages
const NEUTRAL = '#8a8f98';
const BORDER = '#eceef2';
const STATUS_COLORS = { Processing: 'warning', Shipped: 'info', Delivered: 'success', Cancelled: 'error' };
const STEPS = ['Processing', 'Shipped', 'Delivered'];

// What each next status is called on its button
const STATUS_ACTIONS = {
    Shipped: { label: 'Mark as shipped', icon: <LocalShippingOutlinedIcon /> },
    Delivered: { label: 'Mark as delivered', icon: <CheckCircleOutlinedIcon /> },
    Cancelled: { label: 'Cancel order', icon: <CancelOutlinedIcon /> },
};

const cardSx = { border: `1px solid ${BORDER}`, borderRadius: '16px', bgcolor: '#fff', p: 3 };

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

export default function ProcessOrder() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const [confirm, setConfirm] = useState({ open: false });
    const closeConfirm = () => setConfirm((current) => ({ ...current, open: false }));
    const { order, loading, error } = useSelector((state) => state.orderDetails);

    useEffect(() => {
        dispatch(getOrderDetails(id));
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
            notifySuccess('Order status updated');
            dispatch({ type: UPDATE_ORDER_RESET });
            dispatch(getOrderDetails(id));
        }
    }, [isUpdated, id, dispatch]);

    if (loading) {
        return (
            <>
                <Skeleton width={260} height={40} sx={{ mb: 3 }} />
                <Skeleton variant="rounded" height={90} sx={{ mb: 3, borderRadius: '16px' }} />
                <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1.8fr) minmax(300px,1fr)' } }}>
                    <Skeleton variant="rounded" height={320} sx={{ borderRadius: '16px' }} />
                    <Skeleton variant="rounded" height={320} sx={{ borderRadius: '16px' }} />
                </Box>
            </>
        );
    }

    if (!order) {
        return (
            <Box sx={{ minHeight: 300, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <Box>
                    <ReceiptLongOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                    <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        {error || 'Order not found'}
                    </Typography>
                    <Button size="small" component={Link} to="/admin/orders" sx={{ mt: 1 }}>
                        Back to orders
                    </Button>
                </Box>
            </Box>
        );
    }

    const ship = order.shippingInfo;
    const customerName = order.user?.name || 'Deleted user';
    const nextStatuses = NEXT_ORDER_STATUSES[order.orderStatus] || [];
    const cancelled = order.orderStatus === 'Cancelled';
    // Delivered is the last step, so every step shows as done
    const activeStep = order.orderStatus === 'Delivered' ? STEPS.length : STEPS.indexOf(order.orderStatus);
    const itemCount = order.orderItems.reduce((sum, i) => sum + i.quantity, 0);

    const handleUpdate = (status) => {
        if (status === 'Cancelled') {
            setConfirm({
                open: true,
                title: 'Cancel this order?',
                text: "The items will go back in stock, and this can't be undone.",
                confirmText: 'Yes, cancel order',
                onConfirm: () => dispatch(updateOrder(order._id, status)),
            });
            return;
        }
        dispatch(updateOrder(order._id, status));
    };

    const handleReceipt = async () => {
        const message = await dispatch(downloadReceipt(order._id));
        if (message) notifyError(message);
    };

    return (
        <>
            {/* Title, status and receipt */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Tooltip title="Back to orders">
                        <IconButton component={Link} to="/admin/orders" aria-label="Back to orders" sx={{ border: `1px solid ${BORDER}`, bgcolor: '#fff' }}>
                            <ArrowBackRoundedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                            <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                                Order {shortOrderId(order._id)}
                            </Typography>
                            <Chip size="small" variant="outlined" label={order.orderStatus} color={STATUS_COLORS[order.orderStatus] ?? 'default'} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Placed on {formatDate(order.createdAt)} · {itemCount} item{itemCount === 1 ? '' : 's'}
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<FileDownloadOutlinedIcon />}
                    onClick={handleReceipt}
                    sx={{ borderRadius: 99, px: 2.5, height: 40, borderColor: '#e0e2e7' }}
                >
                    Download receipt
                </Button>
            </Box>

            {/* Progress */}
            <Box sx={{ ...cardSx, mb: 3 }}>
                {cancelled ? (
                    <Alert severity="error" variant="outlined" sx={{ borderRadius: '12px' }}>
                        This order was cancelled, and its items went back in stock.
                    </Alert>
                ) : (
                    <Stepper activeStep={activeStep} alternativeLabel>
                        {STEPS.map((step) => (
                            <Step key={step}>
                                <StepLabel
                                    optional={
                                        step === 'Processing' ? (
                                            <Typography variant="caption" sx={{ color: NEUTRAL }}>
                                                {formatDate(order.createdAt)}
                                            </Typography>
                                        ) : step === 'Delivered' && order.deliveredAt ? (
                                            <Typography variant="caption" sx={{ color: NEUTRAL }}>
                                                {formatDate(order.deliveredAt)}
                                            </Typography>
                                        ) : null
                                    }
                                >
                                    {step}
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                )}
            </Box>

            <Box sx={{ display: 'grid', gap: 3, alignItems: 'start', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1.8fr) minmax(300px,1fr)' } }}>
                {/* Left: items and customer */}
                <Box sx={{ display: 'grid', gap: 3, minWidth: 0 }}>
                    <Box sx={cardSx}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
                            Items
                        </Typography>
                        {order.orderItems.map((item) => (
                            <Box
                                key={`${item.product}|${item.size}|${item.color}`}
                                sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75, borderBottom: '1px solid #f0f1f4', '&:last-of-type': { borderBottom: 0, pb: 0 } }}
                            >
                                <Avatar variant="rounded" src={item.image} alt={item.name} sx={{ width: 56, height: 72, borderRadius: '10px', bgcolor: '#f3f3f3', flexShrink: 0 }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                                        {item.name}
                                    </Typography>
                                    <Typography variant="caption" component="p" sx={{ color: NEUTRAL }}>
                                        Size: {item.size} · Color: {item.color}
                                    </Typography>
                                    <Typography variant="caption" component="p" color="text.secondary">
                                        {item.quantity} × {peso(item.price)}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {peso(item.price * item.quantity)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    <Box sx={cardSx}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
                            Customer &amp; shipping
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Avatar sx={{ bgcolor: '#eceef2', color: 'var(--brand-dark)', fontWeight: 700 }}>{customerName[0]}</Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                                    {customerName}
                                </Typography>
                                <Typography variant="caption" noWrap component="p" sx={{ color: NEUTRAL }}>
                                    {order.user?.email || '—'}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 1.25 }}>
                            <LocationOnOutlinedIcon fontSize="small" sx={{ color: NEUTRAL, mt: 0.25 }} />
                            <Typography variant="body2">
                                {ship.address}
                                <br />
                                {[ship.city, ship.region, ship.postalCode, ship.country].filter(Boolean).join(', ')}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <PhoneOutlinedIcon fontSize="small" sx={{ color: NEUTRAL }} />
                            <Typography variant="body2">{ship.phoneNo}</Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Right: status action and totals (shown first on small screens) */}
                <Box sx={{ display: 'grid', gap: 3, minWidth: 0, order: { xs: -1, lg: 0 } }}>
                    <Box sx={cardSx}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                            Update status
                        </Typography>
                        {nextStatuses.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                This order is {order.orderStatus.toLowerCase()}, so its status can&apos;t be changed anymore.
                            </Typography>
                        ) : (
                            <>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                                    Currently {order.orderStatus.toLowerCase()}. Choose what happens next.
                                </Typography>
                                <Box sx={{ display: 'grid', gap: 1.25 }}>
                                    {nextStatuses.map((status) => {
                                        const action = STATUS_ACTIONS[status];
                                        const isCancel = status === 'Cancelled';
                                        return (
                                            <Button
                                                key={status}
                                                fullWidth
                                                disableElevation
                                                variant={isCancel ? 'outlined' : 'contained'}
                                                color={isCancel ? 'error' : 'primary'}
                                                startIcon={action.icon}
                                                disabled={updating}
                                                onClick={() => handleUpdate(status)}
                                                sx={{ borderRadius: 99, height: 42 }}
                                            >
                                                {action.label}
                                            </Button>
                                        );
                                    })}
                                </Box>
                                <Typography variant="caption" component="p" sx={{ color: NEUTRAL, mt: 2 }}>
                                    The customer is emailed the new status with a PDF receipt. Cancelling puts the items back in stock.
                                </Typography>
                            </>
                        )}
                    </Box>

                    <Box sx={cardSx}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
                            Order summary
                        </Typography>
                        <SummaryRow label="Payment">{order.paymentMethod}</SummaryRow>
                        <SummaryRow label="Payment status">
                            <Chip size="small" variant="outlined" label={order.isPaid ? 'Paid' : 'Unpaid'} color={order.isPaid ? 'success' : 'default'} />
                        </SummaryRow>
                        {order.deliveredAt && <SummaryRow label="Delivered">{formatDate(order.deliveredAt)}</SummaryRow>}
                        <Box sx={{ borderTop: '1px solid #f0f1f4', mt: 1, pt: 1 }}>
                            <SummaryRow label="Items">{peso(order.itemsPrice)}</SummaryRow>
                            <SummaryRow label="Shipping">{order.shippingPrice === 0 ? 'Free' : peso(order.shippingPrice)}</SummaryRow>
                            <SummaryRow label="Total" bold>
                                {peso(order.totalPrice)}
                            </SummaryRow>
                        </Box>
                    </Box>
                </Box>
            </Box>
            <ConfirmDialog {...confirm} onClose={closeConfirm} />
        </>
    );
}
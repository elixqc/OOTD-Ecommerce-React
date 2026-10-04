import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, CircularProgress, MenuItem, TextField, Typography } from '@mui/material';
import OrderInfo from '../Order/OrderInfo';
import { getOrderDetails, updateOrder } from '../../actions/orderActions';
import { clearErrors } from '../../actions/userActions';
import { NEXT_ORDER_STATUSES, UPDATE_ORDER_RESET } from '../../constants/orderConstants';
import { confirmAction, notifyError, notifySuccess, shortOrderId } from '../../Utils/helpers';

export default function ProcessOrder() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { order, loading, error } = useSelector((state) => state.orderDetails);
    const { loading: updating, isUpdated, error: updateError } = useSelector((state) => state.order);
    const [status, setStatus] = useState('');

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
            <div className="loading-screen">
                <CircularProgress />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="catalog-message">
                <Typography variant="h5">{error || 'Order not found'}</Typography>
                <Button variant="contained" component={Link} to="/admin/orders">
                    Back to orders
                </Button>
            </div>
        );
    }

    const nextStatuses = NEXT_ORDER_STATUSES[order.orderStatus] || [];
    // After an update the old choice is no longer allowed, so it falls back to empty
    const selected = nextStatuses.includes(status) ? status : '';

    const handleUpdate = async () => {
        if (selected === 'Cancelled') {
            const confirmed = await confirmAction(
                'Cancel this order?',
                'The items will go back in stock, and this can\'t be undone.',
                'Yes, cancel order'
            );
            if (!confirmed) return;
        }
        dispatch(updateOrder(order._id, selected));
    };

    return (
        <>
            <div className="page-header">
                <Typography variant="h4" component="h1">
                    Process order {shortOrderId(order._id)}
                </Typography>
                <Button component={Link} to="/admin/orders">
                    Back to orders
                </Button>
            </div>

            <OrderInfo order={order} />

            <section className="order-card">
                <Typography variant="h6">Update status</Typography>
                {nextStatuses.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        This order is {order.orderStatus.toLowerCase()}, so its status can't be changed anymore.
                    </Typography>
                ) : (
                    <div className="table-toolbar">
                        <TextField
                            select
                            label="New status"
                            size="small"
                            className="filter-select"
                            value={selected}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            {nextStatuses.map((s) => (
                                <MenuItem key={s} value={s}>
                                    {s}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Button variant="contained" onClick={handleUpdate} disabled={!selected || updating}>
                            {updating ? 'Updating...' : 'Update status'}
                        </Button>
                    </div>
                )}
            </section>
        </>
    );
}

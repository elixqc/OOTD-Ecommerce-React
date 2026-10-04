import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, CircularProgress, Dialog, DialogContent, Typography } from '@mui/material';
import OrderInfo from './OrderInfo';
import ReviewForm from '../Review/ReviewForm';
import { downloadReceipt, getOrderDetails } from '../../actions/orderActions';
import { getMyReviews } from '../../actions/reviewActions';
import { notifyError, shortOrderId } from '../../Utils/helpers';

export default function OrderDetails() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { order, loading, error } = useSelector((state) => state.orderDetails);
    const { reviews: myReviews } = useSelector((state) => state.myReviews);
    const [reviewing, setReviewing] = useState(null); // the order item whose review dialog is open

    useEffect(() => {
        dispatch(getOrderDetails(id));
    }, [dispatch, id]);

    // Only delivered orders can be reviewed, so only then look up the customer's reviews
    const delivered = order?.orderStatus === 'Delivered';
    useEffect(() => {
        if (delivered) dispatch(getMyReviews());
    }, [delivered, dispatch]);

    if (loading) {
        return (
            <div className="loading-screen">
                <CircularProgress />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="catalog-message">
                <Typography variant="h5">{error || 'Order not found'}</Typography>
                <Button variant="contained" component={Link} to="/orders/me">
                    Back to my orders
                </Button>
            </div>
        );
    }

    const reviewFor = (productId) => myReviews.find((r) => r.product === productId);

    const reviewButton = (item) => {
        if (!delivered) return null;
        return (
            <Button size="small" onClick={() => setReviewing(item)}>
                {reviewFor(item.product) ? 'Edit review' : 'Write a review'}
            </Button>
        );
    };

    const handleReceipt = async () => {
        const message = await dispatch(downloadReceipt(order._id));
        if (message) notifyError(message);
    };

    const handleDone = () => {
        setReviewing(null);
        dispatch(getMyReviews());
    };

    return (
        <>
            <div className="page-header">
                <Typography variant="h4" component="h1">
                    Order {shortOrderId(order._id)}
                </Typography>
                <div className="button-row">
                    <Button variant="outlined" onClick={handleReceipt}>
                        Download receipt
                    </Button>
                    <Button component={Link} to="/orders/me">
                        Back to my orders
                    </Button>
                </div>
            </div>

            <OrderInfo order={order} itemAction={reviewButton} />

            <Dialog open={Boolean(reviewing)} onClose={() => setReviewing(null)} fullWidth maxWidth="sm">
                <DialogContent>
                    {reviewing && (
                        <>
                            <Typography variant="h6" gutterBottom>
                                {reviewing.name}
                            </Typography>
                            <ReviewForm
                                key={reviewing.product}
                                productId={reviewing.product}
                                existing={reviewFor(reviewing.product)}
                                onDone={handleDone}
                                onCancel={() => setReviewing(null)}
                            />
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

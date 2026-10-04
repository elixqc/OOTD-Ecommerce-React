import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Rating, Typography } from '@mui/material';
import ReviewForm from './ReviewForm';
import {
    deleteReview,
    getProductReviews,
    getReviewStatus,
    refreshProductReviews,
} from '../../actions/reviewActions';
import { confirmDelete, formatDate, notifyError, notifySuccess } from '../../Utils/helpers';

// Reviews of one product, plus the form for customers who bought it
export default function ListReviews({ productId }) {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { reviews, productId: loadedFor, loading } = useSelector((state) => state.productReviews);
    const status = useSelector((state) => state.reviewStatus);
    const [editing, setEditing] = useState(false);

    const userId = user?._id;
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        dispatch(getProductReviews(productId));
        if (userId) dispatch(getReviewStatus(productId));
    }, [dispatch, productId, userId]);

    const ready = loadedFor === productId;
    const list = ready ? reviews : [];
    const myReview = status.productId === productId ? status.review : null;
    const canReview = status.productId === productId && status.canReview;

    const handleDone = () => {
        setEditing(false);
        dispatch(refreshProductReviews(productId));
    };

    const handleDelete = async (review) => {
        const confirmed = await confirmDelete(
            review._id === myReview?._id ? 'Delete your review?' : `Remove ${review.name}'s review?`
        );
        if (!confirmed) return;

        const message = await dispatch(deleteReview(review._id));
        if (message) {
            notifyError(message);
            return;
        }
        notifySuccess('Review deleted');
        dispatch(refreshProductReviews(productId));
    };

    let formArea = null;
    if (!user) {
        formArea = (
            <Typography variant="body2" color="text.secondary">
                <Link to="/login">Log in</Link> to review products you've bought.
            </Typography>
        );
    } else if (editing && myReview) {
        formArea = (
            <ReviewForm productId={productId} existing={myReview} onDone={handleDone} onCancel={() => setEditing(false)} />
        );
    } else if (!myReview && canReview) {
        formArea = <ReviewForm productId={productId} onDone={handleDone} />;
    } else if (!myReview && status.productId === productId) {
        formArea = (
            <Typography variant="body2" color="text.secondary">
                You can review this product once your order with it has been delivered.
            </Typography>
        );
    }

    return (
        <section className="review-section">
            <Typography variant="h5" component="h2" gutterBottom>
                Customer reviews
            </Typography>

            {formArea}

            {!ready && loading && <Typography color="text.secondary">Loading reviews...</Typography>}
            {ready && list.length === 0 && <Typography color="text.secondary">No reviews yet.</Typography>}

            {list.map((review) => {
                const isMine = review._id === myReview?._id;
                return (
                    <div className="review-item" key={review._id}>
                        <div className="review-header">
                            <Rating value={review.rating} size="small" readOnly />
                            <Typography variant="subtitle2">
                                {review.name}
                                {isMine && ' (you)'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {formatDate(review.createdAt)}
                            </Typography>
                        </div>
                        <Typography variant="body2" className="review-comment">
                            {review.comment}
                        </Typography>
                        {(isMine || isAdmin) && (
                            <div>
                                {isMine && (
                                    <Button size="small" onClick={() => setEditing(true)} disabled={editing}>
                                        Edit
                                    </Button>
                                )}
                                <Button size="small" color="error" onClick={() => handleDelete(review)}>
                                    {isMine ? 'Delete' : 'Remove'}
                                </Button>
                            </div>
                        )}
                    </div>
                );
            })}
        </section>
    );
}

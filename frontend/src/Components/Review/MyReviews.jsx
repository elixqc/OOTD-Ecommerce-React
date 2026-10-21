// MP3 · Review ratings — "My reviews" page.
// Lists the customer's reviews and opens ReviewForm to edit them.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Button,
    Dialog,
    DialogContent,
    IconButton,
    Rating,
    Skeleton,
    Typography,
} from '@mui/material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import ReviewForm from './ReviewForm';
import ConfirmDialog from '../Layout/ConfirmDialog';
import { deleteReview, getMyReviewList } from '../../actions/reviewActions';
import { clearErrors } from '../../actions/userActions';
import { getColorImageUrl } from '../../Utils/productImages';
import { formatDate, notifyError, notifySuccess } from '../../Utils/helpers';

function RowSkeleton() {
    return (
        <div className="cart-row my-review-row" aria-hidden="true">
            <Skeleton variant="rounded" width={96} height={96} animation="wave" />
            <div className="cart-row-info">
                <Skeleton variant="text" width="50%" animation="wave" />
                <Skeleton variant="text" width="30%" animation="wave" />
                <Skeleton variant="text" width="80%" animation="wave" />
            </div>
        </div>
    );
}

export default function MyReviews() {
    const dispatch = useDispatch();
    const { reviews, loading, loaded, error } = useSelector((state) => state.myReviewList);
    const [editing, setEditing] = useState(null); // the review open in the edit dialog
    const [confirm, setConfirm] = useState({ open: false });

    useEffect(() => {
        dispatch(getMyReviewList());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            notifyError(error);
            dispatch(clearErrors());
        }
    }, [error, dispatch]);

    const closeConfirm = () => setConfirm((current) => ({ ...current, open: false }));

    const handleDelete = (review) => {
        setConfirm({
            open: true,
            title: 'Delete this review?',
            text:
                `Your review of "${review.product?.name || 'this product'}" will be removed. ` +
                "This can't be undone.",
            confirmText: 'Yes, delete',
            onConfirm: async () => {
                const message = await dispatch(deleteReview(review._id));
                if (message) {
                    notifyError(message);
                    return;
                }
                notifySuccess('Review deleted');
                dispatch(getMyReviewList());
            },
        });
    };

    const handleEdited = () => {
        setEditing(null);
        dispatch(getMyReviewList());
    };

    if (loading && !loaded) {
        return (
            <div className="cart-page page-enter">
                <div className="cart-header">
                    <Typography variant="h4" component="h1" className="cart-title">
                        My reviews
                    </Typography>
                </div>
                <div className="cart-list">
                    {[0, 1, 2].map((i) => (
                        <RowSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="cart-empty page-enter">
                <div className="cart-empty-icon">
                    <RateReviewOutlinedIcon />
                </div>
                <Typography variant="h5" component="h1" className="cart-empty-title">
                    No reviews yet
                </Typography>
                <Typography color="text.secondary" className="cart-empty-text">
                    Once an order has been delivered, you can review what you bought from My orders.
                </Typography>
                <Button
                    variant="contained"
                    component={Link}
                    to="/orders/me"
                    className="cart-empty-btn"
                >
                    View my orders
                </Button>
            </div>
        );
    }

    return (
        <div className="cart-page page-enter">
            <div className="cart-header">
                <Typography variant="h4" component="h1" className="cart-title">
                    My reviews
                </Typography>
                <Typography color="text.secondary">
                    {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </Typography>
            </div>

            <div className="cart-list">
                {reviews.map((review) => {
                    const product = review.product;
                    const available = Boolean(product) && product.isActive !== false;
                    const image = product ? getColorImageUrl(product, review.color) : '';
                    const edited = new Date(review.updatedAt) - new Date(review.createdAt) > 60000;

                    const picture = image ? (
                        <img src={image} alt={product.name} className="cart-row-image" />
                    ) : (
                        <div className="cart-row-image my-review-noimage" />
                    );

                    return (
                        <div className="cart-row my-review-row" key={review._id}>
                            {available ? (
                                <Link
                                    to={`/product/${product._id}`}
                                    className="cart-row-image-link"
                                >
                                    {picture}
                                </Link>
                            ) : (
                                <div className="cart-row-image-link">{picture}</div>
                            )}

                            <div className="cart-row-info">
                                {available ? (
                                    <Link to={`/product/${product._id}`} className="cart-row-name">
                                        {product.name}
                                    </Link>
                                ) : (
                                    <span className="cart-row-name">
                                        {product?.name || 'Product no longer available'}
                                    </span>
                                )}

                                <div className="cart-row-tags">
                                    {review.size && (
                                        <span className="cart-tag">Size: {review.size}</span>
                                    )}
                                    {review.color && (
                                        <span className="cart-tag">Color: {review.color}</span>
                                    )}
                                    {product && !available && (
                                        <span className="cart-tag wishlist-tag-out">
                                            Unavailable
                                        </span>
                                    )}
                                </div>

                                <div className="my-review-meta">
                                    <Rating value={review.rating} size="small" readOnly />
                                    <Typography variant="body2" color="text.secondary">
                                        {formatDate(review.createdAt)}
                                        {edited ? ' · edited' : ''}
                                    </Typography>
                                </div>

                                {review.comment && (
                                    <Typography className="my-review-comment">
                                        {review.comment}
                                    </Typography>
                                )}
                            </div>

                            <Button
                                variant="outlined"
                                className="wishlist-view-btn"
                                onClick={() => setEditing(review)}
                            >
                                Edit review
                            </Button>

                            <IconButton
                                className="cart-row-remove"
                                aria-label={`Delete your review of ${
                                    product?.name || 'this product'
                                }`}
                                onClick={() => handleDelete(review)}
                            >
                                <DeleteOutlinedIcon />
                            </IconButton>
                        </div>
                    );
                })}
            </div>

            <Dialog
                open={Boolean(editing)}
                onClose={() => setEditing(null)}
                fullWidth
                maxWidth="sm"
            >
                <DialogContent>
                    {editing && (
                        <>
                            <Typography variant="h6" gutterBottom>
                                {editing.product?.name || 'Your review'}
                            </Typography>
                            <ReviewForm
                                key={editing._id}
                                productId={editing.product?._id}
                                existing={editing}
                                onDone={handleEdited}
                                onCancel={() => setEditing(null)}
                            />
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog {...confirm} onClose={closeConfirm} />
        </div>
    );
}

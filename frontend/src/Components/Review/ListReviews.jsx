import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Chip, MenuItem, Rating, TextField, Typography } from '@mui/material';
import ReviewForm from './ReviewForm';
import {
    deleteReview,
    getProductReviews,
    getReviewStatus,
    refreshProductReviews,
} from '../../actions/reviewActions';
import { confirmDelete, formatDate, notifyError, notifySuccess } from '../../Utils/helpers';

const noFilters = { rating: '', withComment: false, size: '', color: '' };

// Reviews of one product, with Shopee-style filters, plus the form for customers who bought it
export default function ListReviews({ productId }) {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const {
        reviews,
        summary,
        variantOptions,
        productId: loadedFor,
        loading,
    } = useSelector((state) => state.productReviews);
    const status = useSelector((state) => state.reviewStatus);
    const [editing, setEditing] = useState(false);
    const [filters, setFilters] = useState(noFilters);

    const userId = user?._id;
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (userId) dispatch(getReviewStatus(productId));
    }, [dispatch, productId, userId]);

    // Loads the reviews, and again whenever a filter changes
    useEffect(() => {
        dispatch(getProductReviews(productId, filters));
    }, [dispatch, productId, filters]);

    const ready = loadedFor === productId;
    const list = ready ? reviews : [];
    const stats = ready ? summary : null;
    const sizes = ready ? variantOptions.sizes : [];
    const colors = ready ? variantOptions.colors : [];
    const myReview = status.productId === productId ? status.review : null;
    const canReview = status.productId === productId && status.canReview;
    const filtering = Boolean(filters.rating || filters.withComment || filters.size || filters.color);

    const setFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));

    const handleDone = () => {
        setEditing(false);
        dispatch(refreshProductReviews(productId, filters));
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
        dispatch(refreshProductReviews(productId, filters));
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

    // One filter button, like the "5 Star (12)" buttons on Shopee
    const chip = (label, active, onClick) => (
        <Chip
            key={label}
            label={label}
            clickable
            onClick={onClick}
            color={active ? 'primary' : 'default'}
            variant={active ? 'filled' : 'outlined'}
        />
    );

    return (
        <section className="review-section">
            <Typography variant="h5" component="h2" gutterBottom>
                Customer reviews
            </Typography>

            {formArea}

            {stats && stats.total > 0 && (
                <div className="review-filters">
                    <div className="review-summary">
                        <Typography variant="h4" component="span">
                            {stats.average.toFixed(1)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" component="span">
                            out of 5
                        </Typography>
                        <Rating value={stats.average} precision={0.1} readOnly />
                    </div>

                    <div className="review-filter-chips">
                        {chip(`All (${stats.total})`, !filters.rating, () => setFilter('rating', ''))}
                        {[5, 4, 3, 2, 1].map((stars) =>
                            chip(`${stars} Star (${stats.byStar[stars]})`, filters.rating === String(stars), () =>
                                setFilter('rating', filters.rating === String(stars) ? '' : String(stars))
                            )
                        )}
                        {chip(`With Comment (${stats.withComment})`, filters.withComment, () =>
                            setFilter('withComment', !filters.withComment)
                        )}
                    </div>

                    {(sizes.length > 0 || colors.length > 0) && (
                        <div className="review-filter-variants">
                            {sizes.length > 0 && (
                                <TextField
                                    select
                                    size="small"
                                    label="Size"
                                    className="filter-select"
                                    value={filters.size}
                                    onChange={(e) => setFilter('size', e.target.value)}
                                >
                                    <MenuItem value="">All sizes</MenuItem>
                                    {sizes.map((size) => (
                                        <MenuItem key={size} value={size}>
                                            {size}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                            {colors.length > 0 && (
                                <TextField
                                    select
                                    size="small"
                                    label="Color"
                                    className="filter-select"
                                    value={filters.color}
                                    onChange={(e) => setFilter('color', e.target.value)}
                                >
                                    <MenuItem value="">All colors</MenuItem>
                                    {colors.map((color) => (
                                        <MenuItem key={color} value={color}>
                                            {color}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                            {filtering && <Button onClick={() => setFilters(noFilters)}>Clear filters</Button>}
                        </div>
                    )}
                    {filtering && sizes.length === 0 && colors.length === 0 && (
                        <Button onClick={() => setFilters(noFilters)}>Clear filters</Button>
                    )}
                </div>
            )}

            {!ready && loading && <Typography color="text.secondary">Loading reviews...</Typography>}
            {ready && stats?.total === 0 && <Typography color="text.secondary">No reviews yet.</Typography>}
            {ready && stats?.total > 0 && list.length === 0 && (
                <Typography color="text.secondary">No reviews match these filters.</Typography>
            )}

            {list.map((review) => {
                const isMine = review._id === myReview?._id;
                const variant = [review.color, review.size].filter(Boolean).join(', ');
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
                        {variant && (
                            <Typography variant="caption" color="text.secondary" display="block">
                                Variation: {variant}
                            </Typography>
                        )}
                        {review.comment && (
                            <Typography variant="body2" className="review-comment">
                                {review.comment}
                            </Typography>
                        )}
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
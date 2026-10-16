import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, MenuItem, Paper, Rating, Skeleton, TextField, Typography } from '@mui/material';
import { useAuth } from '@clerk/react';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ReviewForm from './ReviewForm';
import {
    deleteReview,
    getProductReviews,
    getReviewStatus,
    refreshProductReviews,
} from '../../actions/reviewActions';
import { formatDate, notifyError, notifySuccess } from '../../Utils/helpers';
import ConfirmDialog from '../Layout/ConfirmDialog';

const noFilters = { rating: '', withComment: false, size: '', color: '' };

// Reviews of one product, with filters, plus the form for customers who bought it
export default function ListReviews({ productId }) {
    const dispatch = useDispatch();
    const [confirm, setConfirm] = useState({ open: false });
    const closeConfirm = () => setConfirm((current) => ({ ...current, open: false }));
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
    const { isLoaded: authLoaded, isSignedIn } = useAuth();
    // Don't guess "logged out" or "can't review" until login and review status are known
    const pending = !authLoaded || (isSignedIn && !user) || (Boolean(userId) && status.loading !== false);

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
    const hasReviews = ready && stats?.total > 0;
    const isEmpty = ready && stats?.total === 0;

    const setFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));

    const handleDone = () => {
        setEditing(false);
        dispatch(refreshProductReviews(productId, filters));
    };

    const removeReview = async (review) => {
        const message = await dispatch(deleteReview(review._id));
        if (message) {
            notifyError(message);
            return;
        }
        notifySuccess('Review deleted');
        dispatch(refreshProductReviews(productId, filters));
    };

    const handleDelete = (review) => {
        setConfirm({
            open: true,
            title: 'Are you sure?',
            text: review._id === myReview?._id ? 'Delete your review?' : `Remove ${review.name}'s review?`,
            confirmText: 'Yes, delete',
            onConfirm: () => removeReview(review),
        });
    };

    // The form (when allowed) and a short note (when not)
    let form = null;
    let notice = null;
    if (pending) {
        // wait until we know who is viewing
    } else if (!user) {
        notice = (
            <Typography variant="body2" color="text.secondary">
                <Link to="/login">Log in</Link> to review products you've bought.
            </Typography>
        );
    } else if (editing && myReview) {
        form = (
            <ReviewForm productId={productId} existing={myReview} onDone={handleDone} onCancel={() => setEditing(false)} />
        );
    } else if (!myReview && canReview) {
        form = <ReviewForm productId={productId} onDone={handleDone} />;
    } else if (!myReview && status.productId === productId && !isAdmin) {
        notice = (
            <Typography variant="body2" color="text.secondary">
                You can review this product once your order with it has been delivered.
            </Typography>
        );
    }

    let emptyText = 'Reviews from customers who bought this product will show up here.';
    let emptyAction = null;
    if (pending) {
        emptyText = null;
    } else if (!user) {
        emptyText = 'Bought this product? Log in to leave the first review.';
        emptyAction = (
            <Button component={Link} to="/login" variant="outlined" color="inherit" sx={{ mt: 1 }}>
                Log in
            </Button>
        );
    } else if (form) {
        emptyText = 'Be the first to share what you think.';
    } else if (!myReview && status.productId === productId && !isAdmin) {
        emptyText = 'You can review this product once your order has been delivered.';
    }

    const pill = (label, active, onClick) => (
        <button type="button" className={active ? 'reviews-pill active' : 'reviews-pill'} onClick={onClick} aria-pressed={active}>
            {label}
        </button>
    );

    return (
        <section className="reviews">
            <div className="reviews-head">
                <h2 className="reviews-title">Customer reviews</h2>
                {hasReviews && (
                    <span className="reviews-count">
                        {stats.total} review{stats.total === 1 ? '' : 's'}
                    </span>
                )}
            </div>

            {form}

            {!ready && loading && <Typography color="text.secondary">Loading reviews...</Typography>}

            {isEmpty && (
                <Paper
                    variant="outlined"
                    className="reviews-empty-anim"
                    sx={{ borderRadius: 3, borderColor: '#e5e0d8', py: 6, px: 2 }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1 }}>
                        <Rating
                            value={0}
                            readOnly
                            size="large"
                            sx={{ '& .MuiRating-iconEmpty': { color: '#d8d2c8' } }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            No reviews yet
                        </Typography>
                        {pending ? (
                            <Skeleton variant="text" width={260} />
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
                                {emptyText}
                            </Typography>
                        )}
                        {emptyAction}
                    </Box>
                </Paper>
            )}
            {hasReviews && (
                <div className="reviews-layout">
                    <aside className="reviews-summary">
                        <div className="reviews-score">
                            <span className="reviews-score-number">{stats.average.toFixed(1)}</span>
                            <span className="reviews-score-max">/ 5</span>
                        </div>
                        <Rating value={stats.average} precision={0.1} readOnly />
                        <Typography variant="body2" color="text.secondary">
                            Based on {stats.total} review{stats.total === 1 ? '' : 's'}
                        </Typography>

                        <div className="reviews-bars">
                            {[5, 4, 3, 2, 1].map((stars) => {
                                const count = stats.byStar[stars] || 0;
                                const active = filters.rating === String(stars);
                                return (
                                    <button
                                        type="button"
                                        key={stars}
                                        className={active ? 'reviews-bar active' : 'reviews-bar'}
                                        onClick={() => setFilter('rating', active ? '' : String(stars))}
                                        aria-pressed={active}
                                        aria-label={`${stars} star reviews: ${count}`}
                                    >
                                        <span className="reviews-bar-label">
                                            {stars}
                                            <StarRoundedIcon fontSize="inherit" />
                                        </span>
                                        <span className="reviews-bar-track">
                                            <span className="reviews-bar-fill" style={{ width: `${(count / stats.total) * 100}%` }} />
                                        </span>
                                        <span className="reviews-bar-count">{count}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {notice && <div className="reviews-note">{notice}</div>}
                    </aside>

                    <div className="reviews-main">
                        <div className="reviews-filters">
                            {pill(`All (${stats.total})`, !filtering, () => setFilters(noFilters))}
                            {pill(`With comment (${stats.withComment})`, filters.withComment, () =>
                                setFilter('withComment', !filters.withComment)
                            )}
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

                        {list.length === 0 && (
                            <Typography color="text.secondary" className="reviews-none">
                                No reviews match these filters.
                            </Typography>
                        )}

                        <div className="reviews-list">
                            {list.map((review) => {
                                const isMine = review._id === myReview?._id;
                                const variant = [review.color, review.size].filter(Boolean).join(' · ');
                                return (
                                    <article className="review-card" key={review._id}>
                                        <div className="review-avatar">{review.name?.[0]?.toUpperCase() || '?'}</div>
                                        <div className="review-body">
                                            <div className="review-top">
                                                <div className="review-who">
                                                    <span className="review-name">
                                                        {review.name}
                                                        {isMine && <span className="review-you">You</span>}
                                                    </span>
                                                    <span className="review-verified">
                                                        <CheckCircleOutlineRoundedIcon fontSize="inherit" />
                                                        Verified purchase
                                                    </span>
                                                </div>
                                                <span className="review-date">{formatDate(review.createdAt)}</span>
                                            </div>

                                            <div className="review-meta">
                                                <Rating value={review.rating} size="small" readOnly />
                                                {variant && <span className="review-variant">{variant}</span>}
                                            </div>

                                            {review.comment && <p className="review-text">{review.comment}</p>}

                                            {(isMine || isAdmin) && (
                                                <div className="review-actions">
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
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            <ConfirmDialog {...confirm} onClose={closeConfirm} />
        </section>
    );
}
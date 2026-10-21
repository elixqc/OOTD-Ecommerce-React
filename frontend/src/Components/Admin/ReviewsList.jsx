// MP3 · Review ratings — admin review table.
// Lists every review (masked + flagged) and deletes one via a confirm dialog.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import {
    Avatar,
    Badge,
    Box,
    Button,
    Chip,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Rating,
    Skeleton,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SentimentDissatisfiedOutlinedIcon from '@mui/icons-material/SentimentDissatisfiedOutlined';
import StarOutlineRoundedIcon from '@mui/icons-material/StarOutlineRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { deleteReview, getAdminReviews } from '../../actions/reviewActions';
import { clearErrors } from '../../actions/userActions';
import { formatDate, notifyError, notifySuccess } from '../../Utils/helpers';
import ConfirmDialog from '../Layout/ConfirmDialog';

// Same palette as the dashboard, products, orders and users pages
const NEUTRAL = '#8a8f98';
const BORDER = '#eceef2';

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px' } };

// YYYY-MM-DD in local time, to compare with <input type="date"> values
const toInputDate = (value) => {
    const d = new Date(value);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
};

const variantText = (review) => [review.color, review.size].filter(Boolean).join(' · ');
const customerName = (review) => review.user?.name || review.name || 'Deleted user';

// Same look as the dashboard's KPI cards (uses the .dash-stat styles)
function StatCard({ label, value, icon, loading }) {
    return (
        <Paper elevation={0} className="dash-stat">
            <Box className="dash-stat-icon">{icon}</Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary" noWrap>
                    {label}
                </Typography>
                {loading ? (
                    <Skeleton width={60} height={34} />
                ) : (
                    <Typography
                        component="p"
                        sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.3 }}
                    >
                        {value}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}

function EmptyState({ filtering, onClear }) {
    return (
        <Box
            sx={{
                height: '100%',
                minHeight: 300,
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
            }}
        >
            <Box>
                <RateReviewOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {filtering ? 'No reviews match your filters' : 'No reviews yet'}
                </Typography>
                {filtering && (
                    <Button size="small" onClick={onClear} sx={{ mt: 1 }}>
                        Clear filters
                    </Button>
                )}
            </Box>
        </Box>
    );
}

export default function ReviewsList() {
    const dispatch = useDispatch();
    const [confirm, setConfirm] = useState({ open: false });
    const closeConfirm = () => setConfirm((current) => ({ ...current, open: false }));
    const { reviews, loading, error } = useSelector((state) => state.adminReviews);

    const [keyword, setKeyword] = useState('');
    const [ratingFilter, setRatingFilter] = useState('All');
    const [commentFilter, setCommentFilter] = useState('All'); // All, With, Without, Filtered
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [moreOpen, setMoreOpen] = useState(false);
    const [viewing, setViewing] = useState(null); // the review open in the dialog
    const [showOriginal, setShowOriginal] = useState(false);

    useEffect(() => {
        dispatch(getAdminReviews());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            notifyError(error);
            dispatch(clearErrors());
        }
    }, [error, dispatch]);

    // Numbers for the cards at the top (always every review, not the filtered rows)
    const stats = useMemo(() => {
        const total = reviews.length;
        return {
            total,
            average: total
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
                : '—',
            low: reviews.filter((r) => r.rating <= 2).length,
            filtered: reviews.filter((r) => r.flagged).length,
        };
    }, [reviews]);

    const filteredRows = useMemo(() => {
        const text = keyword.trim().toLowerCase();
        return reviews.filter((r) => {
            const matchesText =
                !text ||
                (r.product?.name || '').toLowerCase().includes(text) ||
                customerName(r).toLowerCase().includes(text) ||
                (r.user?.email || '').toLowerCase().includes(text) ||
                (r.comment || '').toLowerCase().includes(text) ||
                (r.originalComment || '').toLowerCase().includes(text) ||
                [r.size, r.color].some((v) => (v || '').toLowerCase().includes(text));
            const matchesRating = ratingFilter === 'All' || r.rating === Number(ratingFilter);
            const hasComment = Boolean((r.comment || '').trim());
            const matchesComment =
                commentFilter === 'All' ||
                (commentFilter === 'With' && hasComment) ||
                (commentFilter === 'Without' && !hasComment) ||
                (commentFilter === 'Filtered' && r.flagged);
            const day = toInputDate(r.createdAt);
            const matchesDate = (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo);
            return matchesText && matchesRating && matchesComment && matchesDate;
        });
    }, [reviews, keyword, ratingFilter, commentFilter, dateFrom, dateTo]);

    // Filters hidden behind the "Filters" button, counted for its badge
    const moreActive = [commentFilter !== 'All', dateFrom !== '', dateTo !== ''].filter(
        Boolean,
    ).length;
    const filtering = keyword !== '' || ratingFilter !== 'All' || moreActive > 0;
    const dateError =
        dateFrom && dateTo && dateFrom > dateTo
            ? 'Start date must be on or before the end date'
            : '';

    const clearFilters = () => {
        setKeyword('');
        setRatingFilter('All');
        setCommentFilter('All');
        setDateFrom('');
        setDateTo('');
    };

    // Always opens on the filtered text; the admin chooses to reveal the original
    const openReview = (review) => {
        setShowOriginal(false);
        setViewing(review);
    };

    const removeReview = async (review) => {
        const message = await dispatch(deleteReview(review._id));
        if (message) {
            notifyError(message);
            return;
        }
        notifySuccess('Review removed');
        setViewing(null);
        dispatch(getAdminReviews());
    };

    const handleDelete = (review) => {
        setConfirm({
            open: true,
            title: 'Are you sure?',
            text: `Remove ${customerName(review)}'s review? This can't be undone.`,
            confirmText: 'Yes, delete',
            onConfirm: () => removeReview(review),
        });
    };
    const columns = [
        {
            field: 'product',
            headerName: 'Product',
            flex: 1,
            minWidth: 220,
            valueGetter: (value, row) => row.product?.name || 'Deleted product',
            renderCell: (params) => (
                <Box sx={{ minWidth: 0 }}>
                    {params.row.product ? (
                        <Typography
                            component={Link}
                            to={`/product/${params.row.product._id}`}
                            variant="body2"
                            noWrap
                            className="dash-order-link"
                            sx={{ display: 'block', fontWeight: 600 }}
                        >
                            {params.value}
                        </Typography>
                    ) : (
                        <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: NEUTRAL }}>
                            {params.value}
                        </Typography>
                    )}
                    {variantText(params.row) && (
                        <Typography variant="caption" noWrap component="p" sx={{ color: NEUTRAL }}>
                            {variantText(params.row)}
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: 'name',
            headerName: 'Customer',
            flex: 0.9,
            minWidth: 200,
            valueGetter: (value, row) => customerName(row),
            renderCell: (params) => (
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                        {params.value}
                    </Typography>
                    <Typography variant="caption" noWrap component="p" sx={{ color: NEUTRAL }}>
                        {params.row.user?.email || '—'}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'rating',
            headerName: 'Rating',
            type: 'number',
            headerAlign: 'left',
            align: 'left',
            width: 130,
            renderCell: (params) => <Rating value={params.value} size="small" readOnly />,
        },
        {
            field: 'comment',
            headerName: 'Review',
            flex: 1.4,
            minWidth: 260,
            renderCell: (params) => (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        minWidth: 0,
                        width: '100%',
                    }}
                >
                    <Typography
                        variant="body2"
                        noWrap
                        sx={{ color: params.value ? undefined : NEUTRAL, minWidth: 0 }}
                    >
                        {params.value || 'No comment'}
                    </Typography>
                    {params.row.flagged && (
                        <Chip label="Filtered" size="small" color="warning" variant="outlined" />
                    )}
                </Box>
            ),
        },
        {
            field: 'createdAt',
            headerName: 'Date',
            type: 'dateTime',
            width: 130,
            valueGetter: (value) => new Date(value),
            valueFormatter: (value) => formatDate(value),
        },
        {
            field: 'actions',
            headerName: '',
            width: 110,
            align: 'right',
            headerAlign: 'right',
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params) => (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        width: '100%',
                    }}
                >
                    <Tooltip title="View review">
                        <IconButton
                            size="small"
                            onClick={() => openReview(params.row)}
                            aria-label="View review"
                        >
                            <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove review">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(params.row)}
                            aria-label="Remove review"
                        >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    const initialLoad = loading && reviews.length === 0;

    return (
        <>
            {/* Title */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                    Reviews
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    See what customers say and remove reviews that don&apos;t belong
                </Typography>
            </Box>

            {/* KPI cards */}
            <Box className="dash-stats" sx={{ mb: 3 }}>
                <StatCard
                    label="Total reviews"
                    value={stats.total}
                    icon={<RateReviewOutlinedIcon />}
                    loading={initialLoad}
                />
                <StatCard
                    label="Average rating"
                    value={stats.average}
                    icon={<StarOutlineRoundedIcon />}
                    loading={initialLoad}
                />
                <StatCard
                    label="Low ratings (1–2★)"
                    value={stats.low}
                    icon={<SentimentDissatisfiedOutlinedIcon />}
                    loading={initialLoad}
                />
                <StatCard
                    label="Filtered comments"
                    value={stats.filtered}
                    icon={<FlagOutlinedIcon />}
                    loading={initialLoad}
                />
            </Box>

            {/* Filters + table */}
            <Box
                sx={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: '16px',
                    bgcolor: '#fff',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{ p: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}
                >
                    <TextField
                        size="small"
                        placeholder="Search product, customer or review"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        sx={{ ...fieldSx, flex: '1 1 260px', maxWidth: 420 }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRoundedIcon
                                            fontSize="small"
                                            sx={{ color: NEUTRAL }}
                                        />
                                    </InputAdornment>
                                ),
                                endAdornment: keyword && (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            aria-label="Clear search"
                                            onClick={() => setKeyword('')}
                                            edge="end"
                                        >
                                            <CloseRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    <TextField
                        select
                        size="small"
                        value={ratingFilter}
                        onChange={(e) => setRatingFilter(e.target.value)}
                        sx={{ ...fieldSx, minWidth: 150 }}
                        aria-label="Stars"
                    >
                        <MenuItem value="All">All stars</MenuItem>
                        {[5, 4, 3, 2, 1].map((stars) => (
                            <MenuItem key={stars} value={String(stars)}>
                                {stars} star{stars === 1 ? '' : 's'}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Badge badgeContent={moreActive} color="secondary">
                        <Button
                            color="inherit"
                            startIcon={<TuneRoundedIcon />}
                            onClick={() => setMoreOpen((open) => !open)}
                            sx={{
                                borderRadius: '12px',
                                height: 40,
                                color: moreOpen ? undefined : NEUTRAL,
                                fontWeight: 500,
                            }}
                        >
                            Filters
                        </Button>
                    </Badge>
                    {filtering && (
                        <Button
                            color="inherit"
                            onClick={clearFilters}
                            sx={{ color: NEUTRAL, fontWeight: 500 }}
                        >
                            Clear
                        </Button>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                        {filtering
                            ? `${filteredRows.length} of ${reviews.length}`
                            : `${reviews.length}`}{' '}
                        review
                        {reviews.length === 1 ? '' : 's'}
                    </Typography>
                </Box>

                {/* More filters */}
                <Collapse in={moreOpen} unmountOnExit>
                    <Box
                        sx={{
                            px: 2,
                            pb: 2,
                            display: 'grid',
                            gap: 1.5,
                            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                        }}
                    >
                        <TextField
                            select
                            label="Comment"
                            size="small"
                            sx={fieldSx}
                            value={commentFilter}
                            onChange={(e) => setCommentFilter(e.target.value)}
                        >
                            <MenuItem value="All">All reviews</MenuItem>
                            <MenuItem value="With">With comment</MenuItem>
                            <MenuItem value="Without">Without comment</MenuItem>
                            <MenuItem value="Filtered">Filtered (bad words hidden)</MenuItem>
                        </TextField>
                        <TextField
                            label="From"
                            type="date"
                            size="small"
                            sx={fieldSx}
                            value={dateFrom}
                            error={Boolean(dateError)}
                            onChange={(e) => setDateFrom(e.target.value)}
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: { max: dateTo || undefined },
                            }}
                        />
                        <TextField
                            label="To"
                            type="date"
                            size="small"
                            sx={fieldSx}
                            value={dateTo}
                            error={Boolean(dateError)}
                            helperText={dateError}
                            onChange={(e) => setDateTo(e.target.value)}
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: { min: dateFrom || undefined },
                            }}
                        />
                    </Box>
                </Collapse>

                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    getRowId={(row) => row._id}
                    loading={loading}
                    disableRowSelectionOnClick
                    disableColumnSelector
                    autoHeight
                    rowHeight={64}
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    slots={{
                        noRowsOverlay: () => (
                            <EmptyState filtering={filtering} onClear={clearFilters} />
                        ),
                    }}
                    sx={{
                        border: 0,
                        borderTop: `1px solid ${BORDER}`,
                        borderRadius: 0,
                        minHeight: filteredRows.length === 0 ? 360 : undefined,
                        '--DataGrid-t-header-background-base': '#fff',
                        '& .MuiDataGrid-columnHeader': { bgcolor: '#fff' },
                        '& .MuiDataGrid-columnHeaders': { borderBottom: `1px solid ${BORDER}` },
                        '& .MuiDataGrid-columnHeaderTitle': {
                            color: NEUTRAL,
                            fontSize: '0.8rem',
                            fontWeight: 500,
                        },
                        '& .MuiDataGrid-columnSeparator': { display: 'none' },
                        '& .MuiDataGrid-cell': {
                            display: 'flex',
                            alignItems: 'center',
                            borderColor: '#f0f1f4',
                        },
                        ['& .MuiDataGrid-cell:focus, ' +
                        '& .MuiDataGrid-cell:focus-within, ' +
                        '& .MuiDataGrid-columnHeader:focus, ' +
                        '& .MuiDataGrid-columnHeader:focus-within']: { outline: 'none' },
                        '& .MuiDataGrid-row:hover': { bgcolor: '#fafbfc' },
                        '& .MuiDataGrid-footerContainer': { borderColor: BORDER },
                    }}
                />
            </Box>

            {/* One review in full */}
            <Dialog
                open={Boolean(viewing)}
                onClose={() => setViewing(null)}
                fullWidth
                maxWidth="sm"
                slotProps={{ paper: { sx: { borderRadius: '16px' } } }}
            >
                {viewing && (
                    <>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 2,
                                p: 3,
                                pb: 2,
                            }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    variant="h6"
                                    component="h2"
                                    sx={{ fontWeight: 700 }}
                                    noWrap
                                >
                                    {viewing.product?.name || 'Deleted product'}
                                </Typography>
                                {variantText(viewing) && (
                                    <Typography variant="body2" sx={{ color: NEUTRAL }}>
                                        {variantText(viewing)}
                                    </Typography>
                                )}
                            </Box>
                            <IconButton
                                size="small"
                                onClick={() => setViewing(null)}
                                aria-label="Close"
                            >
                                <CloseRoundedIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        <DialogContent sx={{ pt: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <Avatar
                                    sx={{
                                        bgcolor: '#eceef2',
                                        color: 'var(--brand-dark)',
                                        fontWeight: 700,
                                    }}
                                >
                                    {customerName(viewing)[0]?.toUpperCase()}
                                </Avatar>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                                        {customerName(viewing)}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        noWrap
                                        component="p"
                                        sx={{ color: NEUTRAL }}
                                    >
                                        {viewing.user?.email ? `${viewing.user.email} · ` : ''}
                                        {formatDate(viewing.createdAt)}
                                    </Typography>
                                </Box>
                                <Rating value={viewing.rating} readOnly />
                            </Box>

                            {viewing.flagged && (
                                <ToggleButtonGroup
                                    exclusive
                                    fullWidth
                                    size="small"
                                    value={showOriginal ? 'original' : 'filtered'}
                                    onChange={(e, value) =>
                                        value && setShowOriginal(value === 'original')
                                    }
                                    sx={{ mb: 2 }}
                                >
                                    <ToggleButton value="filtered">
                                        As customers see it
                                    </ToggleButton>
                                    <ToggleButton value="original">Original</ToggleButton>
                                </ToggleButtonGroup>
                            )}

                            <Box
                                sx={{
                                    border: `1px solid ${BORDER}`,
                                    bgcolor: '#fafbfc',
                                    borderRadius: '12px',
                                    p: 2,
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        lineHeight: 1.7,
                                        color:
                                            viewing.comment || viewing.originalComment
                                                ? undefined
                                                : NEUTRAL,
                                    }}
                                >
                                    {(viewing.flagged && showOriginal
                                        ? viewing.originalComment
                                        : viewing.comment) || 'No comment'}
                                </Typography>
                            </Box>
                        </DialogContent>

                        <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
                            <Button
                                color="error"
                                variant="outlined"
                                startIcon={<DeleteOutlineRoundedIcon />}
                                onClick={() => handleDelete(viewing)}
                                sx={{ borderRadius: 99, px: 2.5 }}
                            >
                                Remove review
                            </Button>
                            <Button
                                color="inherit"
                                onClick={() => setViewing(null)}
                                sx={{ borderRadius: 99, px: 2.5 }}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
            <ConfirmDialog {...confirm} onClose={closeConfirm} />
        </>
    );
}

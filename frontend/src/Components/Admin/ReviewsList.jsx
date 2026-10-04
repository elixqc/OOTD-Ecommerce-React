import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import {
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Rating,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { deleteReview, getAdminReviews } from '../../actions/reviewActions';
import { clearErrors } from '../../actions/userActions';
import { confirmDelete, formatDate, notifyError, notifySuccess } from '../../Utils/helpers';

export default function ReviewsList() {
    const dispatch = useDispatch();
    const { reviews, loading, error } = useSelector((state) => state.adminReviews);
    const [keyword, setKeyword] = useState('');
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

    const filteredRows = useMemo(() => {
        const text = keyword.trim().toLowerCase();
        if (!text) return reviews;
        return reviews.filter(
            (r) =>
                (r.product?.name || '').toLowerCase().includes(text) ||
                (r.user?.name || r.name).toLowerCase().includes(text) ||
                r.comment.toLowerCase().includes(text) ||
                (r.originalComment || '').toLowerCase().includes(text)
        );
    }, [reviews, keyword]);

    // Always opens on the filtered text; the admin chooses to reveal the original
    const openReview = (review) => {
        setShowOriginal(false);
        setViewing(review);
    };

    const handleDelete = async (review) => {
        const confirmed = await confirmDelete(`Remove ${review.name}'s review? This can't be undone.`);
        if (!confirmed) return;

        const message = await dispatch(deleteReview(review._id));
        if (message) {
            notifyError(message);
            return;
        }
        notifySuccess('Review removed');
        dispatch(getAdminReviews());
    };

    const columns = [
        {
            field: 'product',
            headerName: 'Product',
            width: 200,
            valueGetter: (value, row) => row.product?.name || 'Deleted product',
            renderCell: (params) =>
                params.row.product ? (
                    <Link to={`/product/${params.row.product._id}`}>{params.value}</Link>
                ) : (
                    params.value
                ),
        },
        { field: 'name', headerName: 'Customer', width: 150 },
        {
            field: 'rating',
            headerName: 'Rating',
            type: 'number',
            width: 140,
            renderCell: (params) => <Rating value={params.value} size="small" readOnly />,
        },
        {
            field: 'comment',
            headerName: 'Review',
            flex: 1,
            minWidth: 240,
            renderCell: (params) => (
                <div className="review-cell">
                    <span className="review-cell-text">{params.value}</span>
                    {params.row.flagged && <Chip label="Filtered" size="small" color="warning" variant="outlined" />}
                </div>
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
            width: 170,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <>
                    <Button size="small" onClick={() => openReview(params.row)}>
                        View
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDelete(params.row)}>
                        Remove
                    </Button>
                </>
            ),
        },
    ];

    return (
        <>
            <div className="page-header">
                <Typography variant="h4" component="h1">
                    Reviews
                </Typography>
            </div>

            <div className="table-toolbar">
                <TextField
                    label="Search product, customer, or review"
                    size="small"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
            </div>

            <div className="data-grid-box">
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    getRowId={(row) => row._id}
                    loading={loading}
                    disableRowSelectionOnClick
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                />
            </div>

            <Dialog open={Boolean(viewing)} onClose={() => setViewing(null)} fullWidth maxWidth="sm">
                {viewing && (
                    <>
                        <DialogTitle>{viewing.product?.name || 'Deleted product'}</DialogTitle>
                        <DialogContent dividers>
                            <Typography variant="body2" color="text.secondary">
                                {viewing.user?.name || viewing.name}
                                {viewing.user?.email ? ` · ${viewing.user.email}` : ''} · {formatDate(viewing.createdAt)}
                            </Typography>
                            <Rating value={viewing.rating} size="small" readOnly sx={{ my: 1 }} />

                            {viewing.flagged && (
                                <ToggleButtonGroup
                                    exclusive
                                    size="small"
                                    value={showOriginal ? 'original' : 'filtered'}
                                    onChange={(e, value) => value && setShowOriginal(value === 'original')}
                                    sx={{ display: 'flex', mb: 2 }}
                                >
                                    <ToggleButton value="filtered">As customers see it</ToggleButton>
                                    <ToggleButton value="original">Original</ToggleButton>
                                </ToggleButtonGroup>
                            )}

                            <p className="review-full-text">
                                {viewing.flagged && showOriginal ? viewing.originalComment : viewing.comment}
                            </p>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setViewing(null)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </>
    );
}

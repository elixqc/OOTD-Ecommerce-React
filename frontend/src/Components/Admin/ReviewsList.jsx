import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Rating, TextField, Typography } from '@mui/material';
import { deleteReview, getAdminReviews } from '../../actions/reviewActions';
import { clearErrors } from '../../actions/userActions';
import { confirmDelete, formatDate, notifyError, notifySuccess } from '../../Utils/helpers';

export default function ReviewsList() {
    const dispatch = useDispatch();
    const { reviews, loading, error } = useSelector((state) => state.adminReviews);
    const [keyword, setKeyword] = useState('');

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
                r.comment.toLowerCase().includes(text)
        );
    }, [reviews, keyword]);

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
        { field: 'comment', headerName: 'Review', flex: 1, minWidth: 240 },
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
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Button size="small" color="error" onClick={() => handleDelete(params.row)}>
                    Remove
                </Button>
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
        </>
    );
}

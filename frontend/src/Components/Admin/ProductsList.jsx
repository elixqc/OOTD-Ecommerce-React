import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import { Avatar, Button, MenuItem, TextField, Typography } from '@mui/material';
import { deleteProduct, deleteProducts, getAdminProducts } from '../../actions/productActions';
import { clearErrors } from '../../actions/userActions';
import { DELETE_PRODUCT_RESET, CATEGORIES } from '../../constants/productConstants';
import { confirmDelete, notifyError, notifySuccess } from '../../Utils/helpers';

export default function ProductsList() {
    const dispatch = useDispatch();
    const { products, loading, error } = useSelector((state) => state.adminProducts);
    const { loading: deleting, isDeleted, deletedCount, error: deleteError } = useSelector((state) => state.product);

    const [keyword, setKeyword] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [selectionModel, setSelectionModel] = useState(null);

    useEffect(() => {
        dispatch(getAdminProducts());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            notifyError(error);
            dispatch(clearErrors());
        }
        if (deleteError) {
            notifyError(deleteError);
            dispatch(clearErrors());
        }
    }, [error, deleteError, dispatch]);

    useEffect(() => {
        if (isDeleted) {
            notifySuccess(`${deletedCount} product${deletedCount === 1 ? '' : 's'} deleted`);
            dispatch({ type: DELETE_PRODUCT_RESET });
            dispatch(getAdminProducts());
        }
    }, [isDeleted, deletedCount, dispatch]);

    const filteredRows = useMemo(() => {
        const text = keyword.trim().toLowerCase();
        return products.filter((p) => {
            const matchesText =
                !text ||
                p.name.toLowerCase().includes(text) ||
                (p.brand || '').toLowerCase().includes(text) ||
                p.category.toLowerCase().includes(text);
            const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
            return matchesText && matchesCategory;
        });
    }, [products, keyword, categoryFilter]);

    // Newer DataGrid versions give { type, ids: Set }, older ones give an array
    const getSelectedIds = (model) => {
        if (!model) return [];
        if (Array.isArray(model)) return model;
        if (model.type === 'exclude') {
            return filteredRows.map((p) => p._id).filter((id) => !model.ids.has(id));
        }
        return [...model.ids];
    };
    const selectedIds = getSelectedIds(selectionModel);

    const handleDelete = async (product) => {
        const confirmed = await confirmDelete(`Delete "${product.name}"? Its images and reviews will be removed too.`);
        if (confirmed) dispatch(deleteProduct(product._id));
    };

    const handleBulkDelete = async () => {
        const confirmed = await confirmDelete(
            `Delete ${selectedIds.length} selected product${selectedIds.length === 1 ? '' : 's'}? Their images and reviews will be removed too.`
        );
        if (confirmed) dispatch(deleteProducts(selectedIds));
    };

    const columns = [
        {
            field: 'image',
            headerName: '',
            width: 70,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Avatar variant="rounded" src={params.row.coverImage} alt={params.row.name} />
            ),
        },
        { field: 'name', headerName: 'Name', flex: 1, minWidth: 180 },
        { field: 'category', headerName: 'Category', width: 130 },
        {
            field: 'price',
            headerName: 'Price',
            type: 'number',
            width: 120,
            valueFormatter: (value) => `₱${Number(value).toLocaleString()}`,
        },
        { field: 'totalStock', headerName: 'Stock', type: 'number', width: 90 },
        { field: 'ratings', headerName: 'Rating', type: 'number', width: 90 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 170,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <>
                    <Button size="small" component={Link} to={`/admin/product/${params.row._id}`}>
                        Edit
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDelete(params.row)}>
                        Delete
                    </Button>
                </>
            ),
        },
    ];

    return (
        <>
            <div className="page-header">
                <Typography variant="h4" component="h1">
                    Products
                </Typography>
                <Button variant="contained" component={Link} to="/admin/product/new">
                    New product
                </Button>
            </div>

            <div className="table-toolbar">
                <TextField
                    label="Search name, brand, or category"
                    size="small"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
                <TextField
                    select
                    label="Category"
                    size="small"
                    className="filter-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <MenuItem value="All">All categories</MenuItem>
                    {CATEGORIES.map((category) => (
                        <MenuItem key={category} value={category}>
                            {category}
                        </MenuItem>
                    ))}
                </TextField>
                <div className="table-toolbar-spacer" />
                <Button
                    variant="contained"
                    color="error"
                    disabled={selectedIds.length === 0 || deleting}
                    onClick={handleBulkDelete}
                >
                    Delete selected ({selectedIds.length})
                </Button>
            </div>

            <div className="data-grid-box">
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    getRowId={(row) => row._id}
                    loading={loading}
                    checkboxSelection
                    disableRowSelectionOnClick
                    onRowSelectionModelChange={setSelectionModel}
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                />
            </div>
        </>
    );
}
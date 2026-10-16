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
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Rating,
    Skeleton,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { deleteProduct, deleteProducts, getAdminProducts, setProductActive } from '../../actions/productActions';
import { clearErrors } from '../../actions/userActions';
import { DELETE_PRODUCT_RESET, CATEGORIES } from '../../constants/productConstants';
import { notifyError, notifySuccess, peso } from '../../Utils/helpers';
import ConfirmDialog from '../Layout/ConfirmDialog';

// Same palette as the dashboard
const NEUTRAL = '#8a8f98';
const BORDER = '#eceef2';
const LOW_STOCK = 5; // this many or fewer left counts as "low"

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px' } };

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
                    <Typography component="p" sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.3 }}>
                        {value}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}

function EmptyState({ filtering, onClear }) {
    return (
        <Box sx={{ height: '100%', minHeight: 300, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <Box>
                <Inventory2OutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {filtering ? 'No products match your filters' : 'No products yet'}
                </Typography>
                {filtering ? (
                    <Button size="small" onClick={onClear} sx={{ mt: 1 }}>
                        Clear filters
                    </Button>
                ) : (
                    <Button size="small" component={Link} to="/admin/product/new" sx={{ mt: 1 }}>
                        Add your first product
                    </Button>
                )}
            </Box>
        </Box>
    );
}

export default function ProductsList() {
    const dispatch = useDispatch();
    const [confirm, setConfirm] = useState({ open: false });
    const closeConfirm = () => setConfirm((current) => ({ ...current, open: false }));
    const { products, loading, error } = useSelector((state) => state.adminProducts);

    const [keyword, setKeyword] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [stockFilter, setStockFilter] = useState('All');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [ratingFilter, setRatingFilter] = useState('All');
    const [reviewsFilter, setReviewsFilter] = useState('All');
    const [moreOpen, setMoreOpen] = useState(false);
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

    // Numbers for the cards at the top (always the whole catalog, not the filtered rows)
    const counts = useMemo(() => {
        const hidden = products.filter((p) => p.isActive === false).length;
        return {
            total: products.length,
            active: products.length - hidden,
            hidden,
            low: products.filter((p) => p.totalStock <= LOW_STOCK).length,
        };
    }, [products]);

    const filteredRows = useMemo(() => {
        const text = keyword.trim().toLowerCase();
        const min = minPrice === '' ? null : Number(minPrice);
        const max = maxPrice === '' ? null : Number(maxPrice);
        const minRating = ratingFilter === 'All' ? 0 : Number(ratingFilter);
        const minReviews = reviewsFilter === 'All' ? 0 : Number(reviewsFilter);

        return products.filter((p) => {
            const matchesText =
                !text ||
                p.name.toLowerCase().includes(text) ||
                (p.brand || '').toLowerCase().includes(text) ||
                p.category.toLowerCase().includes(text);
            const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
            const isHidden = p.isActive === false;
            const matchesStatus = statusFilter === 'All' || (statusFilter === 'hidden' ? isHidden : !isHidden);
            const matchesStock =
                stockFilter === 'All' ||
                (stockFilter === 'out' ? p.totalStock === 0 : p.totalStock > 0 && p.totalStock <= LOW_STOCK);
            const matchesPrice = (min === null || p.price >= min) && (max === null || p.price <= max);
            const matchesRating = p.ratings >= minRating;
            const matchesReviews = (p.numOfReviews || 0) >= minReviews;
            return (
                matchesText && matchesCategory && matchesStatus && matchesStock && matchesPrice && matchesRating && matchesReviews
            );
        });
    }, [products, keyword, categoryFilter, statusFilter, stockFilter, minPrice, maxPrice, ratingFilter, reviewsFilter]);

    // Filters hidden behind the "Filters" button, counted for its badge
    const moreActive = [statusFilter !== 'All', stockFilter !== 'All', minPrice !== '', maxPrice !== '', ratingFilter !== 'All', reviewsFilter !== 'All']
        .filter(Boolean).length;
    const filtering = keyword !== '' || categoryFilter !== 'All' || moreActive > 0;

    const clearFilters = () => {
        setKeyword('');
        setCategoryFilter('All');
        setStatusFilter('All');
        setStockFilter('All');
        setMinPrice('');
        setMaxPrice('');
        setRatingFilter('All');
        setReviewsFilter('All');
    };

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

    const handleDelete = (product) => {
        setConfirm({
            open: true,
            title: 'Are you sure?',
            text: `Delete "${product.name}"? Its images and reviews will be removed too.`,
            confirmText: 'Yes, delete',
            onConfirm: () => dispatch(deleteProduct(product._id)),
        });
    };

    const handleBulkDelete = () => {
        setConfirm({
            open: true,
            title: 'Are you sure?',
            text: `Delete ${selectedIds.length} selected product${selectedIds.length === 1 ? '' : 's'}? Their images and reviews will be removed too.`,
            confirmText: 'Yes, delete',
            onConfirm: () => dispatch(deleteProducts(selectedIds)),
        });
    };

    const handleToggleActive = async (product) => {
        const activate = product.isActive === false;
        const message = await dispatch(setProductActive(product._id, activate));
        if (message) notifyError(message);
        else notifySuccess(activate ? 'Product is visible in the shop again' : 'Product hidden from the shop');
    };

    const columns = [
        {
            field: 'name',
            headerName: 'Product',
            flex: 1.6,
            minWidth: 260,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, width: '100%' }}>
                    <Avatar
                        variant="rounded"
                        src={params.row.coverImage}
                        alt={params.row.name}
                        sx={{ width: 44, height: 56, borderRadius: '10px', bgcolor: '#f3f3f3', flexShrink: 0 }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                            {params.row.name}
                        </Typography>
                        <Typography variant="caption" noWrap component="p" sx={{ color: NEUTRAL }}>
                            {[params.row.brand, params.row.gender].filter(Boolean).join(' · ') || '—'}
                        </Typography>
                    </Box>
                </Box>
            ),
        },
        {
            field: 'category',
            headerName: 'Category',
            width: 140,
            renderCell: (params) => <Chip size="small" variant="outlined" label={params.value} />,
        },
        {
            field: 'price',
            headerName: 'Price',
            type: 'number',
            headerAlign: 'left',
            align: 'left',
            width: 120,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {peso(Number(params.value))}
                </Typography>
            ),
        },
        {
            field: 'totalStock',
            headerName: 'Stock',
            type: 'number',
            headerAlign: 'left',
            align: 'left',
            width: 130,
            renderCell: (params) => {
                if (params.value === 0) return <Chip size="small" color="error" variant="outlined" label="Out of stock" />;
                if (params.value <= LOW_STOCK)
                    return <Chip size="small" color="warning" variant="outlined" label={`${params.value} left`} />;
                return <Typography variant="body2">{params.value}</Typography>;
            },
        },
        {
            field: 'ratings',
            headerName: 'Rating',
            type: 'number',
            headerAlign: 'left',
            align: 'left',
            width: 170,
            renderCell: (params) =>
                params.row.numOfReviews > 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Rating value={params.value} precision={0.5} size="small" readOnly />
                        <Typography variant="caption" sx={{ color: NEUTRAL }}>
                            ({params.row.numOfReviews})
                        </Typography>
                    </Box>
                ) : (
                    <Typography variant="caption" sx={{ color: NEUTRAL }}>
                        No reviews
                    </Typography>
                ),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            valueGetter: (value, row) => (row.isActive === false ? 'Hidden' : 'Active'),
            renderCell: (params) => (
                <Chip
                    size="small"
                    variant="outlined"
                    label={params.value}
                    color={params.value === 'Active' ? 'success' : 'default'}
                />
            ),
        },
        {
            field: 'actions',
            headerName: '',
            width: 150,
            align: 'right',
            headerAlign: 'right',
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params) => {
                const hidden = params.row.isActive === false;
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                        <Tooltip title="Edit">
                            <IconButton size="small" component={Link} to={`/admin/product/${params.row._id}`} aria-label="Edit product">
                                <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={hidden ? 'Show in shop' : 'Hide from shop'}>
                            <IconButton
                                size="small"
                                aria-label={hidden ? 'Show in shop' : 'Hide from shop'}
                                onClick={() => handleToggleActive(params.row)}
                            >
                                {hidden ? <VisibilityOutlinedIcon fontSize="small" /> : <VisibilityOffOutlinedIcon fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton size="small" color="error" aria-label="Delete product" onClick={() => handleDelete(params.row)}>
                                <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                );
            },
        },
    ];

    const initialLoad = loading && products.length === 0;

    return (
        <>
            {/* Title + main action */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Box>
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                        Products
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your catalog, stock and what shoppers can see
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    disableElevation
                    startIcon={<AddRoundedIcon />}
                    component={Link}
                    to="/admin/product/new"
                    sx={{ borderRadius: 99, px: 2.5, height: 40 }}
                >
                    New product
                </Button>
            </Box>

            {/* KPI cards */}
            <Box className="dash-stats" sx={{ mb: 3 }}>
                <StatCard label="Total products" value={counts.total} icon={<Inventory2OutlinedIcon />} loading={initialLoad} />
                <StatCard label="Active in shop" value={counts.active} icon={<CheckCircleOutlinedIcon />} loading={initialLoad} />
                <StatCard label="Hidden" value={counts.hidden} icon={<VisibilityOffOutlinedIcon />} loading={initialLoad} />
                <StatCard label="Low / out of stock" value={counts.low} icon={<WarningAmberRoundedIcon />} loading={initialLoad} />
            </Box>

            {/* Filters + table */}
            <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '16px', bgcolor: '#fff', overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                    <TextField
                        size="small"
                        placeholder="Search name, brand or category"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        sx={{ ...fieldSx, flex: '1 1 260px', maxWidth: 420 }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRoundedIcon fontSize="small" sx={{ color: NEUTRAL }} />
                                    </InputAdornment>
                                ),
                                endAdornment: keyword && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" aria-label="Clear search" onClick={() => setKeyword('')} edge="end">
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
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        sx={{ ...fieldSx, minWidth: 170 }}
                        aria-label="Category"
                    >
                        <MenuItem value="All">All categories</MenuItem>
                        {CATEGORIES.map((category) => (
                            <MenuItem key={category} value={category}>
                                {category}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Badge badgeContent={moreActive} color="secondary">
                        <Button
                            color="inherit"
                            startIcon={<TuneRoundedIcon />}
                            onClick={() => setMoreOpen((open) => !open)}
                            sx={{ borderRadius: '12px', height: 40, color: moreOpen ? undefined : NEUTRAL, fontWeight: 500 }}
                        >
                            Filters
                        </Button>
                    </Badge>
                    {filtering && (
                        <Button color="inherit" onClick={clearFilters} sx={{ color: NEUTRAL, fontWeight: 500 }}>
                            Clear
                        </Button>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                        {filtering ? `${filteredRows.length} of ${products.length}` : `${products.length}`} product
                        {products.length === 1 ? '' : 's'}
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
                            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
                        }}
                    >
                        <TextField select label="Status" size="small" sx={fieldSx} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <MenuItem value="All">All</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="hidden">Hidden</MenuItem>
                        </TextField>
                        <TextField select label="Stock" size="small" sx={fieldSx} value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                            <MenuItem value="All">All</MenuItem>
                            <MenuItem value="low">Low ({LOW_STOCK} or fewer)</MenuItem>
                            <MenuItem value="out">Out of stock</MenuItem>
                        </TextField>
                        <TextField label="Min price" type="number" size="small" sx={fieldSx} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                        <TextField label="Max price" type="number" size="small" sx={fieldSx} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                        <TextField select label="Rating" size="small" sx={fieldSx} value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
                            <MenuItem value="All">Any rating</MenuItem>
                            {[4, 3, 2, 1].map((stars) => (
                                <MenuItem key={stars} value={String(stars)}>
                                    {stars} stars &amp; up
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField select label="Reviews" size="small" sx={fieldSx} value={reviewsFilter} onChange={(e) => setReviewsFilter(e.target.value)}>
                            <MenuItem value="All">Any number</MenuItem>
                            <MenuItem value="1">Has reviews</MenuItem>
                            <MenuItem value="5">5+ reviews</MenuItem>
                            <MenuItem value="10">10+ reviews</MenuItem>
                        </TextField>
                    </Box>
                </Collapse>

                {/* Shows up when rows are ticked */}
                <Collapse in={selectedIds.length > 0}>
                    <Box
                        sx={{
                            px: 2,
                            py: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                            bgcolor: '#f6f7f9',
                            borderTop: `1px solid ${BORDER}`,
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {selectedIds.length} selected
                        </Typography>
                        <Button
                            color="error"
                            size="small"
                            disableElevation
                            variant="contained"
                            startIcon={<DeleteOutlinedIcon />}
                            disabled={deleting}
                            onClick={handleBulkDelete}
                            sx={{ borderRadius: 99, px: 2 }}
                        >
                            Delete selected
                        </Button>
                    </Box>
                </Collapse>

                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    getRowId={(row) => row._id}
                    loading={loading}
                    checkboxSelection
                    disableRowSelectionOnClick
                    disableColumnSelector
                    autoHeight
                    rowHeight={72}
                    onRowSelectionModelChange={setSelectionModel}
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    slots={{ noRowsOverlay: () => <EmptyState filtering={filtering} onClear={clearFilters} /> }}
                    sx={{
                        border: 0,
                        borderTop: `1px solid ${BORDER}`,
                        borderRadius: 0,
                        minHeight: filteredRows.length === 0 ? 360 : undefined,
                        '--DataGrid-t-header-background-base': '#fff',
                        '& .MuiDataGrid-columnHeader': { bgcolor: '#fff' },
                        '& .MuiDataGrid-columnHeaders': { borderBottom: `1px solid ${BORDER}` },
                        '& .MuiDataGrid-columnHeaderTitle': { color: NEUTRAL, fontSize: '0.8rem', fontWeight: 500 },
                        '& .MuiDataGrid-columnSeparator': { display: 'none' },
                        '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center', borderColor: '#f0f1f4' },
                        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within':
                            { outline: 'none' },
                        '& .MuiDataGrid-row:hover': { bgcolor: '#fafbfc' },
                        '& .MuiDataGrid-footerContainer': { borderColor: BORDER },
                    }}
                />
            </Box>
            <ConfirmDialog {...confirm} onClose={closeConfirm} />
        </>
    );
}
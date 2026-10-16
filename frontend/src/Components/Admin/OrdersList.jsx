import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import {
    Badge,
    Box,
    Button,
    Chip,
    Collapse,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Skeleton,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { getAdminOrders } from '../../actions/orderActions';
import { clearErrors } from '../../actions/userActions';
import { ORDER_STATUSES } from '../../constants/orderConstants';
import { formatDate, notifyError, peso, shortOrderId } from '../../Utils/helpers';

// Same palette as the dashboard and products page
const NEUTRAL = '#8a8f98';
const BORDER = '#eceef2';
const STATUS_COLORS = { Processing: 'warning', Shipped: 'info', Delivered: 'success', Cancelled: 'error' };

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px' } };

// YYYY-MM-DD in local time, to compare with <input type="date"> values
const toInputDate = (value) => {
    const d = new Date(value);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// "Blue Hoodie +2 more", same wording as the dashboard's last transactions
const itemSummary = (order) => {
    const items = order.orderItems || [];
    if (items.length === 0) return '—';
    return items.length > 1 ? `${items[0].name} +${items.length - 1} more` : items[0].name;
};

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
                <ReceiptLongOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {filtering ? 'No orders match your filters' : 'No orders yet'}
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

export default function OrdersList() {
    const dispatch = useDispatch();
    const { orders, totalAmount, loading, error } = useSelector((state) => state.adminOrders);

    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [minTotal, setMinTotal] = useState('');
    const [maxTotal, setMaxTotal] = useState('');
    const [moreOpen, setMoreOpen] = useState(false);

    useEffect(() => {
        dispatch(getAdminOrders());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            notifyError(error);
            dispatch(clearErrors());
        }
    }, [error, dispatch]);

    // Numbers for the cards at the top (always every order, not the filtered rows)
    const counts = useMemo(
        () => ({
            total: orders.length,
            processing: orders.filter((o) => o.orderStatus === 'Processing').length,
            delivered: orders.filter((o) => o.orderStatus === 'Delivered').length,
        }),
        [orders]
    );

    const filteredRows = useMemo(() => {
        const text = keyword.trim().toLowerCase();
        const min = minTotal === '' ? null : Number(minTotal);
        const max = maxTotal === '' ? null : Number(maxTotal);

        return orders.filter((o) => {
            const matchesText =
                !text ||
                shortOrderId(o._id).toLowerCase().includes(text) ||
                (o.user?.name || '').toLowerCase().includes(text) ||
                (o.user?.email || '').toLowerCase().includes(text);
            const matchesStatus = statusFilter === 'All' || o.orderStatus === statusFilter;
            const day = toInputDate(o.createdAt);
            const matchesDate = (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo);
            const matchesTotal = (min === null || o.totalPrice >= min) && (max === null || o.totalPrice <= max);
            return matchesText && matchesStatus && matchesDate && matchesTotal;
        });
    }, [orders, keyword, statusFilter, dateFrom, dateTo, minTotal, maxTotal]);

    // Filters hidden behind the "Filters" button, counted for its badge
    const moreActive = [dateFrom !== '', dateTo !== '', minTotal !== '', maxTotal !== ''].filter(Boolean).length;
    const filtering = keyword !== '' || statusFilter !== 'All' || moreActive > 0;
    const dateError = dateFrom && dateTo && dateFrom > dateTo ? 'Start date must be on or before the end date' : '';

    const clearFilters = () => {
        setKeyword('');
        setStatusFilter('All');
        setDateFrom('');
        setDateTo('');
        setMinTotal('');
        setMaxTotal('');
    };

    const columns = [
        {
            field: '_id',
            headerName: 'Order ID',
            width: 120,
            renderCell: (params) => (
                <Link to={`/admin/order/${params.row._id}`} className="dash-order-link" style={{ fontWeight: 600 }}>
                    {shortOrderId(params.value)}
                </Link>
            ),
        },
        {
            field: 'customer',
            headerName: 'Customer',
            flex: 1.2,
            minWidth: 220,
            valueGetter: (value, row) => row.user?.name || 'Deleted user',
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
            field: 'items',
            headerName: 'Item',
            flex: 1,
            minWidth: 200,
            sortable: false,
            valueGetter: (value, row) => itemSummary(row),
            renderCell: (params) => (
                <Typography variant="body2" noWrap>
                    {params.value}
                </Typography>
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
            field: 'totalPrice',
            headerName: 'Total',
            type: 'number',
            headerAlign: 'left',
            align: 'left',
            width: 130,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {peso(Number(params.value))}
                </Typography>
            ),
        },
        {
            field: 'orderStatus',
            headerName: 'Status',
            width: 130,
            renderCell: (params) => (
                <Chip size="small" variant="outlined" label={params.value} color={STATUS_COLORS[params.value] ?? 'default'} />
            ),
        },
        {
            field: 'actions',
            headerName: '',
            width: 80,
            align: 'right',
            headerAlign: 'right',
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                    <Tooltip title="Process order">
                        <IconButton size="small" component={Link} to={`/admin/order/${params.row._id}`} aria-label="Process order">
                            <LocalShippingOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    const initialLoad = loading && orders.length === 0;

    return (
        <>
            {/* Title */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                    Orders
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Track, search and process every order in your store
                </Typography>
            </Box>

            {/* KPI cards */}
            <Box className="dash-stats" sx={{ mb: 3 }}>
                <StatCard label="Total orders" value={counts.total} icon={<ReceiptLongOutlinedIcon />} loading={initialLoad} />
                <StatCard label="Processing" value={counts.processing} icon={<HourglassEmptyOutlinedIcon />} loading={initialLoad} />
                <StatCard label="Delivered" value={counts.delivered} icon={<AssignmentTurnedInOutlinedIcon />} loading={initialLoad} />
                <StatCard label="Total sales" value={peso(totalAmount || 0)} icon={<PaymentsOutlinedIcon />} loading={initialLoad} />
            </Box>

            {/* Filters + table */}
            <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '16px', bgcolor: '#fff', overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                    <TextField
                        size="small"
                        placeholder="Search order #, name or email"
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
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        sx={{ ...fieldSx, minWidth: 170 }}
                        aria-label="Status"
                    >
                        <MenuItem value="All">All statuses</MenuItem>
                        {ORDER_STATUSES.map((status) => (
                            <MenuItem key={status} value={status}>
                                {status}
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
                        {filtering ? `${filteredRows.length} of ${orders.length}` : `${orders.length}`} order
                        {orders.length === 1 ? '' : 's'}
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
                            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                        }}
                    >
                        <TextField
                            label="From"
                            type="date"
                            size="small"
                            sx={fieldSx}
                            value={dateFrom}
                            error={Boolean(dateError)}
                            onChange={(e) => setDateFrom(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: dateTo || undefined } }}
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
                            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: dateFrom || undefined } }}
                        />
                        <TextField label="Min total" type="number" size="small" sx={fieldSx} value={minTotal} onChange={(e) => setMinTotal(e.target.value)} />
                        <TextField label="Max total" type="number" size="small" sx={fieldSx} value={maxTotal} onChange={(e) => setMaxTotal(e.target.value)} />
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
        </>
    );
}
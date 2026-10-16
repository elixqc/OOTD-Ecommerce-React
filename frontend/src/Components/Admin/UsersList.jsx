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
    Skeleton,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { clearErrors, getAllUsers, updateUser } from '../../actions/userActions';
import { UPDATE_USER_RESET } from '../../constants/userConstants';
import { formatDate, notifyError, notifySuccess, peso } from '../../Utils/helpers';
import ConfirmDialog from '../Layout/ConfirmDialog';

// Same palette as the dashboard, products and orders pages
const NEUTRAL = '#8a8f98';
const BORDER = '#eceef2';

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px' } };

// YYYY-MM-DD in local time, to compare with <input type="date"> values
const toInputDate = (value) => {
    const d = new Date(value);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Admins don't shop, so their order numbers are just noise unless they really placed an order
const hidesOrders = (row) => row.role === 'admin' && !row.orderCount;

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
                <GroupOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {filtering ? 'No users match your filters' : 'No users yet'}
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

export default function UsersList() {
    const dispatch = useDispatch();
    const { users, loading, error } = useSelector((state) => state.allUsers);
    const { isUpdated, updatedUser, error: updateError } = useSelector((state) => state.adminUser);

    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [roleFilter, setRoleFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [moreOpen, setMoreOpen] = useState(false);

    useEffect(() => {
        dispatch(getAllUsers());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            notifyError(error);
            dispatch(clearErrors());
        }
        if (updateError) {
            notifyError(updateError);
            dispatch(clearErrors());
        }
    }, [error, updateError, dispatch]);

    useEffect(() => {
        if (isUpdated) {
            notifySuccess(updatedUser?.isActive ? 'Account activated' : 'Account deactivated');
            dispatch({ type: UPDATE_USER_RESET });
            dispatch(getAllUsers());
        }
    }, [isUpdated, updatedUser, dispatch]);

    // Numbers for the cards at the top (always every user, not the filtered rows)
    const counts = useMemo(() => {
        const now = new Date();
        return {
            total: users.length,
            active: users.filter((u) => u.isActive).length,
            deactivated: users.filter((u) => !u.isActive).length,
            newThisMonth: users.filter((u) => {
                const joined = new Date(u.createdAt);
                return joined.getFullYear() === now.getFullYear() && joined.getMonth() === now.getMonth();
            }).length,
        };
    }, [users]);

    const filteredRows = useMemo(() => {
        const text = keyword.trim().toLowerCase();
        return users.filter((u) => {
            const matchesText = !text || u.name.toLowerCase().includes(text) || u.email.toLowerCase().includes(text);
            const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' ? u.isActive : !u.isActive);
            const matchesRole = roleFilter === 'All' || u.role === roleFilter;
            const day = toInputDate(u.createdAt);
            const matchesDate = (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo);
            return matchesText && matchesStatus && matchesRole && matchesDate;
        });
    }, [users, keyword, statusFilter, roleFilter, dateFrom, dateTo]);

    // Filters hidden behind the "Filters" button, counted for its badge
    const moreActive = [roleFilter !== 'All', dateFrom !== '', dateTo !== ''].filter(Boolean).length;
    const filtering = keyword !== '' || statusFilter !== 'All' || moreActive > 0;
    const dateError = dateFrom && dateTo && dateFrom > dateTo ? 'Start date must be on or before the end date' : '';

    const clearFilters = () => {
        setKeyword('');
        setStatusFilter('All');
        setRoleFilter('All');
        setDateFrom('');
        setDateTo('');
    };

    const handleToggle = async (user) => {
        const deactivating = user.isActive;
        const confirmed = await confirmAction(
            deactivating ? 'Deactivate this account?' : 'Activate this account?',
            deactivating
                ? `${user.name} won't be able to log in or use their account until you activate it again.`
                : `${user.name} will be able to log in again.`,
            deactivating ? 'Yes, deactivate' : 'Yes, activate'
        );
        if (confirmed) dispatch(updateUser(user._id, !deactivating));
    };

    const columns = [
        {
            field: 'name',
            headerName: 'User',
            flex: 1.3,
            minWidth: 260,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Avatar src={params.row.avatar?.url || undefined} sx={{ width: 36, height: 36, bgcolor: '#eceef2', color: 'var(--brand-dark)', fontWeight: 700 }}>
                        {params.row.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                            {params.row.name}
                        </Typography>
                        <Typography variant="caption" noWrap component="p" sx={{ color: NEUTRAL }}>
                            {params.row.email}
                        </Typography>
                    </Box>
                </Box>
            ),
        },
        {
            field: 'role',
            headerName: 'Role',
            width: 110,
            renderCell: (params) => (
                <Chip
                    size="small"
                    variant="outlined"
                    label={params.value === 'admin' ? 'Admin' : 'Customer'}
                    color={params.value === 'admin' ? 'primary' : 'default'}
                />
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            valueGetter: (value, row) => (row.isActive ? 'Active' : 'Deactivated'),
            renderCell: (params) => (
                <Chip size="small" variant="outlined" label={params.value} color={params.value === 'Active' ? 'success' : 'default'} />
            ),
        },
        {
            field: 'orderCount',
            headerName: 'Orders',
            type: 'number',
            headerAlign: 'left',
            align: 'left',
            width: 100,
            valueGetter: (value) => value || 0,
            renderCell: (params) =>
                hidesOrders(params.row) ? (
                    <Typography variant="body2" sx={{ color: NEUTRAL }}>
                        —
                    </Typography>
                ) : (
                    params.value
                ),
        },
        {
            field: 'totalSpent',
            headerName: 'Total spent',
            type: 'number',
            headerAlign: 'left',
            align: 'left',
            width: 140,
            valueGetter: (value) => value || 0,
            renderCell: (params) =>
                hidesOrders(params.row) ? (
                    <Typography variant="body2" sx={{ color: NEUTRAL }}>
                        —
                    </Typography>
                ) : (
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {peso(Number(params.value))}
                    </Typography>
                ),
        },
        {
            field: 'createdAt',
            headerName: 'Joined',
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                    <Tooltip title="View user">
                        <IconButton size="small" component={Link} to={`/admin/user/${params.row._id}`} aria-label="View user">
                            <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {params.row.role !== 'admin' && (
                        <Tooltip title={params.row.isActive ? 'Deactivate account' : 'Activate account'}>
                            <IconButton
                                size="small"
                                color={params.row.isActive ? 'error' : 'success'}
                                onClick={() => handleToggle(params.row)}
                                aria-label={params.row.isActive ? 'Deactivate account' : 'Activate account'}
                            >
                                {params.row.isActive ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlinedIcon fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            ),
        },
    ];

    const initialLoad = loading && users.length === 0;

    return (
        <>
            {/* Title */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                    Users
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Search accounts, see who is buying, and manage access
                </Typography>
            </Box>

            {/* KPI cards */}
            <Box className="dash-stats" sx={{ mb: 3 }}>
                <StatCard label="Total users" value={counts.total} icon={<GroupOutlinedIcon />} loading={initialLoad} />
                <StatCard label="Active" value={counts.active} icon={<CheckCircleOutlinedIcon />} loading={initialLoad} />
                <StatCard label="Deactivated" value={counts.deactivated} icon={<PersonOffOutlinedIcon />} loading={initialLoad} />
                <StatCard label="New this month" value={counts.newThisMonth} icon={<PersonAddAltOutlinedIcon />} loading={initialLoad} />
            </Box>

            {/* Filters + table */}
            <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '16px', bgcolor: '#fff', overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                    <TextField
                        size="small"
                        placeholder="Search name or email"
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
                        <MenuItem value="All">All accounts</MenuItem>
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Deactivated">Deactivated</MenuItem>
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
                        {filtering ? `${filteredRows.length} of ${users.length}` : `${users.length}`} user
                        {users.length === 1 ? '' : 's'}
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
                        <TextField select label="Role" size="small" sx={fieldSx} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <MenuItem value="All">All roles</MenuItem>
                            <MenuItem value="customer">Customers</MenuItem>
                            <MenuItem value="admin">Admins</MenuItem>
                        </TextField>
                        <TextField
                            label="Joined from"
                            type="date"
                            size="small"
                            sx={fieldSx}
                            value={dateFrom}
                            error={Boolean(dateError)}
                            onChange={(e) => setDateFrom(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: dateTo || undefined } }}
                        />
                        <TextField
                            label="Joined to"
                            type="date"
                            size="small"
                            sx={fieldSx}
                            value={dateTo}
                            error={Boolean(dateError)}
                            helperText={dateError}
                            onChange={(e) => setDateTo(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: dateFrom || undefined } }}
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
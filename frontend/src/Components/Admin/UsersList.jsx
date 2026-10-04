import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import { Avatar, Button, Chip, MenuItem, TextField, Typography } from '@mui/material';
import { clearErrors, getAllUsers, updateUser } from '../../actions/userActions';
import { UPDATE_USER_RESET } from '../../constants/userConstants';
import { confirmAction, formatDate, notifyError, notifySuccess } from '../../Utils/helpers';

export default function UsersList() {
    const dispatch = useDispatch();
    const { users, loading, error } = useSelector((state) => state.allUsers);
    const { isUpdated, updatedUser, error: updateError } = useSelector((state) => state.adminUser);

    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

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

    const filteredRows = useMemo(() => {
        const text = keyword.trim().toLowerCase();
        return users.filter((u) => {
            const matchesText =
                !text || u.name.toLowerCase().includes(text) || u.email.toLowerCase().includes(text);
            const matchesStatus =
                statusFilter === 'All' || (statusFilter === 'Active' ? u.isActive : !u.isActive);
            return matchesText && matchesStatus;
        });
    }, [users, keyword, statusFilter]);

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
            headerName: 'Name',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <div className="user-cell">
                    <Avatar src={params.row.avatar?.url || undefined} sx={{ width: 32, height: 32 }}>
                        {params.row.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <span>{params.row.name}</span>
                </div>
            ),
        },
        { field: 'email', headerName: 'Email', flex: 1, minWidth: 220 },
        {
            field: 'role',
            headerName: 'Role',
            width: 110,
            renderCell: (params) => <Chip size="small" variant="outlined" label={params.value} />,
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 140,
            valueGetter: (value, row) => (row.isActive ? 'Active' : 'Deactivated'),
            renderCell: (params) => (
                <Chip size="small" label={params.value} color={params.value === 'Active' ? 'success' : 'default'} />
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
            headerName: 'Actions',
            width: 210,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <>
                    <Button size="small" component={Link} to={`/admin/user/${params.row._id}`}>
                        View
                    </Button>
                    {params.row.role !== 'admin' && (
                        <Button
                            size="small"
                            color={params.row.isActive ? 'error' : 'success'}
                            onClick={() => handleToggle(params.row)}
                        >
                            {params.row.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                    )}
                </>
            ),
        },
    ];

    return (
        <>
            <div className="page-header">
                <Typography variant="h4" component="h1">
                    Users
                </Typography>
                <Typography variant="subtitle1">{users.length} registered accounts</Typography>
            </div>

            <div className="table-toolbar">
                <TextField
                    label="Search name or email"
                    size="small"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
                <TextField
                    select
                    label="Status"
                    size="small"
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <MenuItem value="All">All accounts</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Deactivated">Deactivated</MenuItem>
                </TextField>
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
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import { Button, MenuItem, TextField, Typography } from '@mui/material';
import OrderStatusChip from '../Order/OrderStatusChip';
import { deleteOrder, getAdminOrders } from '../../actions/orderActions';
import { clearErrors } from '../../actions/userActions';
import { DELETE_ORDER_RESET, ORDER_STATUSES } from '../../constants/orderConstants';
import { confirmDelete, formatDate, notifyError, notifySuccess, peso, shortOrderId } from '../../Utils/helpers';

export default function OrdersList() {
    const dispatch = useDispatch();
    const { orders, totalAmount, loading, error } = useSelector((state) => state.adminOrders);
    const { isDeleted, error: deleteError } = useSelector((state) => state.order);

    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        dispatch(getAdminOrders());
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
            notifySuccess('Order deleted');
            dispatch({ type: DELETE_ORDER_RESET });
            dispatch(getAdminOrders());
        }
    }, [isDeleted, dispatch]);

    const filteredRows = useMemo(() => {
        const text = keyword.trim().toLowerCase();
        return orders.filter((o) => {
            const matchesText =
                !text ||
                shortOrderId(o._id).toLowerCase().includes(text) ||
                (o.user?.name || '').toLowerCase().includes(text) ||
                (o.user?.email || '').toLowerCase().includes(text);
            const matchesStatus = statusFilter === 'All' || o.orderStatus === statusFilter;
            return matchesText && matchesStatus;
        });
    }, [orders, keyword, statusFilter]);

    const handleDelete = async (order) => {
        const confirmed = await confirmDelete(
            `Delete order ${shortOrderId(order._id)}? ${
                ['Processing', 'Shipped'].includes(order.orderStatus) ? 'Its items will go back in stock.' : ''
            }`
        );
        if (confirmed) dispatch(deleteOrder(order._id));
    };

    const columns = [
        { field: '_id', headerName: 'Order', width: 110, valueFormatter: (value) => shortOrderId(value) },
        {
            field: 'customer',
            headerName: 'Customer',
            flex: 1,
            minWidth: 180,
            valueGetter: (value, row) => row.user?.name || 'Deleted user',
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
            width: 130,
            valueFormatter: (value) => peso(value),
        },
        {
            field: 'orderStatus',
            headerName: 'Status',
            width: 130,
            renderCell: (params) => <OrderStatusChip status={params.value} />,
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 170,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <>
                    <Button size="small" component={Link} to={`/admin/order/${params.row._id}`}>
                        Process
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
                    Orders
                </Typography>
                <Typography variant="subtitle1">Total sales (excluding cancelled): {peso(totalAmount)}</Typography>
            </div>

            <div className="table-toolbar">
                <TextField
                    label="Search order #, name, or email"
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
                    <MenuItem value="All">All statuses</MenuItem>
                    {ORDER_STATUSES.map((status) => (
                        <MenuItem key={status} value={status}>
                            {status}
                        </MenuItem>
                    ))}
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

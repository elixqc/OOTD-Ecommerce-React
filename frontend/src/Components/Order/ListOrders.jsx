import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Typography } from '@mui/material';
import OrderStatusChip from './OrderStatusChip';
import { getMyOrders } from '../../actions/orderActions';
import { clearErrors } from '../../actions/userActions';
import { formatDate, notifyError, peso, shortOrderId } from '../../Utils/helpers';

export default function ListOrders() {
    const dispatch = useDispatch();
    const { orders, loading, error } = useSelector((state) => state.myOrders);

    useEffect(() => {
        dispatch(getMyOrders());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            notifyError(error);
            dispatch(clearErrors());
        }
    }, [error, dispatch]);

    const columns = [
        { field: '_id', headerName: 'Order', width: 110, valueFormatter: (value) => shortOrderId(value) },
        {
            field: 'createdAt',
            headerName: 'Date',
            type: 'dateTime',
            width: 130,
            valueGetter: (value) => new Date(value),
            valueFormatter: (value) => formatDate(value),
        },
        {
            field: 'items',
            headerName: 'Items',
            type: 'number',
            width: 90,
            valueGetter: (value, row) => row.orderItems.reduce((sum, i) => sum + i.quantity, 0),
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
            headerName: '',
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Button size="small" component={Link} to={`/order/${params.row._id}`}>
                    {params.row.orderStatus === 'Delivered' ? 'View & review' : 'View'}
                </Button>
            ),
        },
    ];

    return (
        <>
            <Typography variant="h4" component="h1" className="page-title">
                My orders
            </Typography>
            <div className="data-grid-box">
                <DataGrid
                    rows={orders}
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

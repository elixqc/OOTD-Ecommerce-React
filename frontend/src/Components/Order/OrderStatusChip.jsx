import { Chip } from '@mui/material';

const COLORS = {
    Processing: 'warning',
    Shipped: 'info',
    Delivered: 'success',
    Cancelled: 'default',
};

export default function OrderStatusChip({ status }) {
    return <Chip size="small" label={status} color={COLORS[status] || 'default'} />;
}

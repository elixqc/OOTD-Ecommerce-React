import { useEffect, useState } from 'react';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import api from '../../api';
import { notifyError, peso } from '../../Utils/helpers';

const COLORS = ['#c8553d', '#1f1f1f', '#e0a458', '#6a8d92', '#8c6a5d', '#a3b18a', '#b56576', '#355070', '#99816a', '#4f6d7a'];

function StatCard({ label, value }) {
    return (
        <Paper variant="outlined" sx={{ p: 2, flex: '1 1 180px' }}>
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="h5" component="p" sx={{ fontWeight: 700 }}>
                {value}
            </Typography>
        </Paper>
    );
}

function ChartCard({ title, empty, children }) {
    return (
        <Paper variant="outlined" sx={{ p: 2, flex: '1 1 420px', minWidth: 0 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                {title}
            </Typography>
            {empty ? (
                <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                    No sales yet
                </Typography>
            ) : (
                <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>{children}</ResponsiveContainer>
                </Box>
            )}
        </Paper>
    );
}

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        api.get('/admin/dashboard')
            .then(({ data }) => !cancelled && setStats(data))
            .catch((err) => !cancelled && notifyError(err.response?.data?.message || 'Could not load the dashboard'))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) return <CircularProgress aria-label="Loading dashboard" />;
    if (!stats) return <Typography>Dashboard data is unavailable.</Typography>;

    const hasMonthlySales = stats.salesPerMonth.some((m) => m.total > 0);

    return (
        <>
            <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
                Dashboard
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <StatCard label="Total sales" value={peso(stats.totalSales)} />
                <StatCard label="Orders" value={stats.totalOrders} />
                <StatCard label="Products" value={stats.totalProducts} />
                <StatCard label="Users" value={stats.totalUsers} />
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <ChartCard title={`Monthly sales (${stats.year})`} empty={!hasMonthlySales}>
                    <LineChart data={stats.salesPerMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(v) => peso(v)} width={80} />
                        <Tooltip formatter={(v) => peso(v)} />
                        <Line type="monotone" dataKey="total" name="Sales" stroke="#c8553d" strokeWidth={2} />
                    </LineChart>
                </ChartCard>

                <ChartCard title="Top products by sales" empty={stats.productSales.length === 0}>
                    <PieChart>
                        <Pie data={stats.productSales} dataKey="total" nameKey="name" outerRadius={100}>
                            {stats.productSales.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(v) => peso(v)} />
                        <Legend />
                    </PieChart>
                </ChartCard>

                <ChartCard title="Top customers by spend" empty={stats.customerSales.length === 0}>
                    <BarChart data={stats.customerSales}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(v) => peso(v)} width={80} />
                        <Tooltip formatter={(v) => peso(v)} />
                        <Bar dataKey="total" name="Spent" fill="#1f1f1f" />
                    </BarChart>
                </ChartCard>
            </Box>
        </>
    );
}

import { useEffect, useMemo, useState } from 'react';
import {
    Avatar,
    Box,
    Chip,
    LinearProgress,
    Paper,
    Skeleton,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import api from '../../api';
import { formatDate, notifyError, peso } from '../../Utils/helpers';

// ---------- date helpers (local time, YYYY-MM-DD for <input type="date">) ----------
const toInputDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return toInputDate(d);
};

const PRESETS = [
    { id: 'today', label: 'Today', range: () => ({ from: daysAgo(0), to: daysAgo(0) }) },
    { id: '7d', label: 'Last 7 days', range: () => ({ from: daysAgo(6), to: daysAgo(0) }) },
    { id: '30d', label: 'Last 30 days', range: () => ({ from: daysAgo(29), to: daysAgo(0) }) },
    { id: '90d', label: 'Last 90 days', range: () => ({ from: daysAgo(89), to: daysAgo(0) }) },
    { id: 'ytd', label: 'This year', range: () => ({ from: `${new Date().getFullYear()}-01-01`, to: daysAgo(0) }) },
];

const compactPeso = (v) => `₱${new Intl.NumberFormat('en', { notation: 'compact' }).format(v)}`;
const truncate = (text, max = 16) => (String(text).length > max ? `${String(text).slice(0, max - 1)}…` : text);

// ---------- small presentational pieces ----------
function StatCard({ label, value, icon, color, loading }) {
    return (
        <Paper
            variant="outlined"
            sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 3, bgcolor: 'background.paper' }}
        >
            <Avatar sx={{ bgcolor: `${color}1f`, color, width: 48, height: 48 }}>{icon}</Avatar>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary" noWrap>
                    {label}
                </Typography>
                {loading ? (
                    <Skeleton width={90} height={32} />
                ) : (
                    <Typography variant="h5" component="p" sx={{ fontWeight: 700, lineHeight: 1.25 }} noWrap>
                        {value}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}

function ChartCard({ title, subtitle, action, empty, loading, height = 320, sx, children }) {
    return (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, minWidth: 0, ...sx }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Box>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                {action}
            </Box>

            {loading ? (
                <Skeleton variant="rounded" height={height} />
            ) : empty ? (
                <Box sx={{ height, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                    <Box>
                        <ShowChartIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                        <Typography color="text.secondary">No sales in this period</Typography>
                    </Box>
                </Box>
            ) : (
                <Box sx={{ width: '100%', height }}>
                    <ResponsiveContainer>{children}</ResponsiveContainer>
                </Box>
            )}
        </Paper>
    );
}

function SalesTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
        <Paper elevation={4} sx={{ p: 1.5, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {label}
            </Typography>
            <Typography variant="body2">Sales: {peso(row.total)}</Typography>
            <Typography variant="body2" color="text.secondary">
                Orders: {row.orders}
            </Typography>
        </Paper>
    );
}

// ---------- page ----------
export default function Dashboard() {
    const theme = useTheme();
    const accent = theme.palette.secondary.main;
    const dark = theme.palette.primary.main;

    const [range, setRange] = useState(() => PRESETS.find((p) => p.id === 'ytd').range()); // this year by default
    const [chartType, setChartType] = useState('line');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const rangeError = range.from && range.to && range.from > range.to ? 'Start date must be on or before the end date' : '';
    const rangeReady = Boolean(range.from && range.to) && !rangeError;

    useEffect(() => {
        if (!rangeReady) return undefined;
        let cancelled = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        api.get('/admin/dashboard', { params: { from: range.from, to: range.to } })
            .then(({ data }) => !cancelled && setStats(data))
            .catch((err) => !cancelled && notifyError(err.response?.data?.message || 'Could not load the dashboard'))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [range.from, range.to, rangeReady]);

    const activePreset = useMemo(
        () => PRESETS.find((p) => {
            const r = p.range();
            return r.from === range.from && r.to === range.to;
        })?.id ?? null,
        [range.from, range.to]
    );

    const hasSales = stats?.salesOverTime.some((b) => b.total > 0);
    const initialLoad = loading && !stats;
    const periodLabel = stats ? `${formatDate(stats.from)} – ${formatDate(stats.to)}` : '';

    const salesChartProps = {
        data: stats?.salesOverTime ?? [],
        margin: { top: 8, right: 16, left: 0, bottom: 0 },
    };
    const salesAxes = (
        <>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis tickFormatter={compactPeso} tickLine={false} axisLine={false} width={64} />
            <Tooltip content={<SalesTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
        </>
    );

    return (
        <>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
                    Sales dashboard
                </Typography>
                <Typography color="text.secondary">
                    {periodLabel ? `Showing ${periodLabel}` : 'Choose a date range to see how the store is doing'}
                </Typography>
            </Box>

            {/* Filters */}
            <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                {loading && stats && <LinearProgress color="secondary" sx={{ position: 'absolute', inset: '0 0 auto 0' }} />}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    <TextField
                        label="From"
                        type="date"
                        size="small"
                        value={range.from}
                        error={Boolean(rangeError)}
                        onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: range.to || undefined } }}
                    />
                    <TextField
                        label="To"
                        type="date"
                        size="small"
                        value={range.to}
                        error={Boolean(rangeError)}
                        helperText={rangeError}
                        onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: range.from || undefined } }}
                    />

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: { md: 'auto' } }}>
                        {PRESETS.map((p) => (
                            <Chip
                                key={p.id}
                                label={p.label}
                                clickable
                                color={activePreset === p.id ? 'secondary' : 'default'}
                                variant={activePreset === p.id ? 'filled' : 'outlined'}
                                onClick={() => setRange(p.range())}
                            />
                        ))}
                    </Box>
                </Box>
            </Paper>

            {/* KPI cards */}
            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    mb: 3,
                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
                }}
            >
                <StatCard label="Total sales" value={peso(stats?.totalSales ?? 0)} icon={<PaidOutlinedIcon />} color="#c8553d" loading={initialLoad} />
                <StatCard label="Orders" value={stats?.totalOrders ?? 0} icon={<ShoppingBagOutlinedIcon />} color="#355070" loading={initialLoad} />
                <StatCard label="Avg. order value" value={peso(stats?.averageOrderValue ?? 0)} icon={<ReceiptLongOutlinedIcon />} color="#6a8d92" loading={initialLoad} />
                <StatCard label="Products" value={stats?.totalProducts ?? 0} icon={<Inventory2OutlinedIcon />} color="#e0a458" loading={initialLoad} />
                <StatCard label="Users" value={stats?.totalUsers ?? 0} icon={<PeopleOutlinedIcon />} color="#8c6a5d" loading={initialLoad} />
            </Box>

            {/* Sales over time: line or bar */}
            <ChartCard
                title="Sales over time"
                subtitle={stats ? `Per ${stats.granularity} · cancelled orders excluded` : undefined}
                empty={!hasSales}
                loading={initialLoad}
                height={340}
                sx={{ mb: 3 }}
                action={
                    <ToggleButtonGroup
                        exclusive
                        size="small"
                        value={chartType}
                        onChange={(_, value) => value && setChartType(value)}
                        aria-label="Chart type"
                    >
                        <ToggleButton value="line" aria-label="Line chart">
                            <ShowChartIcon fontSize="small" sx={{ mr: 0.5 }} /> Line
                        </ToggleButton>
                        <ToggleButton value="bar" aria-label="Bar chart">
                            <BarChartIcon fontSize="small" sx={{ mr: 0.5 }} /> Bar
                        </ToggleButton>
                    </ToggleButtonGroup>
                }
            >
                {chartType === 'line' ? (
                    <LineChart {...salesChartProps}>
                        {salesAxes}
                        <Line
                            type="monotone"
                            dataKey="total"
                            name="Sales"
                            stroke={accent}
                            strokeWidth={3}
                            dot={(stats?.salesOverTime.length ?? 0) <= 31}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                ) : (
                    <BarChart {...salesChartProps}>
                        {salesAxes}
                        <Bar dataKey="total" name="Sales" fill={accent} radius={[6, 6, 0, 0]} />
                    </BarChart>
                )}
            </ChartCard>

            {/* Rankings */}
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
                <ChartCard
                    title="Top products"
                    subtitle="By sales in the selected period"
                    empty={stats?.productSales.length === 0}
                    loading={initialLoad}
                    height={Math.max(260, (stats?.productSales.length ?? 0) * 38)}
                >
                    <BarChart data={stats?.productSales ?? []} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                        <XAxis type="number" tickFormatter={compactPeso} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="name" width={130} tickFormatter={(v) => truncate(v, 18)} tickLine={false} axisLine={false} />
                        <Tooltip formatter={(v) => peso(v)} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                        <Bar dataKey="total" name="Sales" fill={accent} radius={[0, 6, 6, 0]} />
                    </BarChart>
                </ChartCard>

                <ChartCard
                    title="Top customers"
                    subtitle="By total spend in the selected period"
                    empty={stats?.customerSales.length === 0}
                    loading={initialLoad}
                    height={Math.max(260, (stats?.customerSales.length ?? 0) * 38)}
                >
                    <BarChart data={stats?.customerSales ?? []} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                        <XAxis type="number" tickFormatter={compactPeso} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="name" width={130} tickFormatter={(v) => truncate(v, 18)} tickLine={false} axisLine={false} />
                        <Tooltip formatter={(v) => peso(v)} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                        <Bar dataKey="total" name="Spent" fill={dark} radius={[0, 6, 6, 0]} />
                    </BarChart>
                </ChartCard>
            </Box>
        </>
    );
}
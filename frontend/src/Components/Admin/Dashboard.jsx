// Q2 · Sales chart — admin dashboard.
// Fetches /admin/dashboard and renders the Recharts chart with a date-range filter and line/bar toggle.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    LinearProgress,
    ListItemIcon,
    Menu,
    MenuItem,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import {
    Area,
    Bar,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import api from '../../api';
import { logout } from '../../actions/userActions';
import { formatDate, notifyError, peso } from '../../Utils/helpers';

const SALES_COLOR = '#355070';
const ORDERS_COLOR = '#e0a458';
const GOOD = '#2e9e6b';
const BAD = '#e5584f';
const NEUTRAL = '#8a8f98';
const MINT = '#5fc9a0';

// ---------- date helpers (local time, YYYY-MM-DD for <input type="date">) ----------
const toInputDate = (d) => {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
};

const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return toInputDate(d);
};

const PRESETS = [
    { id: '1d', label: '1D', range: () => ({ from: daysAgo(0), to: daysAgo(0) }) },
    { id: '7d', label: '7D', range: () => ({ from: daysAgo(6), to: daysAgo(0) }) },
    { id: '30d', label: '30D', range: () => ({ from: daysAgo(29), to: daysAgo(0) }) },
    { id: '90d', label: '90D', range: () => ({ from: daysAgo(89), to: daysAgo(0) }) },
    {
        id: 'ytd',
        label: 'YTD',
        range: () => ({ from: `${new Date().getFullYear()}-01-01`, to: daysAgo(0) }),
    },
];

const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

// null means there was nothing in the previous period to compare with
const pctChange = (current, previous) => {
    if (!previous) return current > 0 ? null : 0;
    return ((current - previous) / previous) * 100;
};

const STATUS_COLORS = {
    Processing: 'warning',
    Shipped: 'info',
    Delivered: 'success',
    Cancelled: 'error',
};

// ---------- small presentational pieces ----------
function ChangeChip({ value, invert = false }) {
    if (value === null) {
        return (
            <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, color: NEUTRAL }}>
                New
            </Typography>
        );
    }
    const up = value >= 0;
    const good = invert ? !up : up;
    const color = value === 0 ? NEUTRAL : good ? GOOD : BAD;
    const Icon = up ? ArrowUpwardRoundedIcon : ArrowDownwardRoundedIcon;

    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
            <Box
                sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: color,
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                }}
            >
                <Icon sx={{ fontSize: 11 }} />
            </Box>
            <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, color }}>
                {`${up ? '+' : ''}${value.toFixed(1)}%`}
            </Typography>
        </Box>
    );
}

// Green circle + "₱2,330.00 (+2.5%)" line under the big sales number
function SalesDelta({ diff, percent }) {
    const up = diff >= 0;
    const color = diff === 0 ? NEUTRAL : up ? MINT : BAD;
    const Icon = up ? ArrowUpwardRoundedIcon : ArrowDownwardRoundedIcon;
    const percentText =
        percent === null ? 'New' : `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`;

    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            <Box
                sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: color,
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                }}
            >
                <Icon sx={{ fontSize: 11 }} />
            </Box>
            <Typography component="span" sx={{ fontSize: 13, fontWeight: 500, color }}>
                {`${diff < 0 ? '-' : ''}${peso(Math.abs(diff))} (${percentText})`}
            </Typography>
        </Box>
    );
}

// Avatar pill in the top right that opens the account menu
function UserMenu({ user }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const close = () => setAnchorEl(null);
    const go = (path) => {
        close();
        navigate(path);
    };

    return (
        <>
            <Button
                color="inherit"
                className="dash-user-btn"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <Avatar
                    src={user?.avatar?.url || undefined}
                    alt={user?.name}
                    sx={{ width: 32, height: 32 }}
                >
                    {user?.name?.[0]}
                </Avatar>
                <KeyboardArrowDownRoundedIcon
                    fontSize="small"
                    className={`dash-user-chevron${open ? ' open' : ''}`}
                />
            </Button>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={close}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { className: 'dash-user-menu' } }}
            >
                <Box className="dash-user-menu-head">
                    <Typography sx={{ fontWeight: 700 }} noWrap>
                        {user?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {user?.email}
                    </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => go('/me')}>
                    <ListItemIcon>
                        <PersonOutlineRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    My profile
                </MenuItem>
                <MenuItem onClick={() => go('/')}>
                    <ListItemIcon>
                        <StorefrontOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    Back to store
                </MenuItem>
                <Divider />
                <MenuItem
                    onClick={() => {
                        close();
                        dispatch(logout());
                    }}
                >
                    <ListItemIcon>
                        <LogoutOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>
        </>
    );
}

function StatCard({ label, value, icon, change, invert, loading }) {
    return (
        <Paper elevation={0} className="dash-stat">
            <Box className="dash-stat-icon">{icon}</Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary" noWrap>
                    {label}
                </Typography>
                {loading ? (
                    <Skeleton width={90} height={34} />
                ) : (
                    <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}
                    >
                        <Typography
                            component="p"
                            sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.3 }}
                        >
                            {value}
                        </Typography>
                        {change !== undefined && <ChangeChip value={change} invert={invert} />}
                    </Box>
                )}
            </Box>
        </Paper>
    );
}

function SalesTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
        <Box className="dash-tooltip">
            <Typography sx={{ fontWeight: 700, mb: 1 }}>{label}</Typography>
            <Box className="dash-tooltip-row">
                <span style={{ background: SALES_COLOR }} />
                <em>Sales</em>
                <strong>{peso(row.total)}</strong>
            </Box>
            <Box className="dash-tooltip-row">
                <span style={{ background: ORDERS_COLOR }} />
                <em>Orders</em>
                <strong>{row.orders}</strong>
            </Box>
        </Box>
    );
}

// Shows the product photo, or a grey tile with its initial when the image link is broken
function ProductImage({ src, name }) {
    const [failed, setFailed] = useState(false);
    if (!src || failed) {
        return <Box className="dash-slide-img dash-slide-fallback">{name?.[0]}</Box>;
    }
    return (
        <Box
            component="img"
            src={src}
            alt={name}
            className="dash-slide-img"
            onError={() => setFailed(true)}
        />
    );
}

const SLIDE_SHIFT = 100; // px between the center tile and the ones beside it

// Top sellers carousel. Tiles glide into place when you move through the list.
function TopSellers({ items, loading }) {
    // Keeps counting up or down (never wraps), so tiles slide smoothly instead of jumping
    const [index, setIndex] = useState(0);
    const count = items.length;
    const mod = (k) => ((k % count) + count) % count;
    const current = count ? mod(index) : 0;
    const item = count ? items[current] : null;

    const slots = [];
    if (count) for (let k = index - 2; k <= index + 2; k++) slots.push(k);

    const onKeyDown = (event) => {
        if (count < 2) return;
        if (event.key === 'ArrowLeft') setIndex(index - 1);
        if (event.key === 'ArrowRight') setIndex(index + 1);
    };

    return (
        <Paper elevation={0} className="dash-congrats">
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                Congratulations!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Some of your products already have the highest buyers.
            </Typography>

            {loading ? (
                <Skeleton variant="rounded" height={210} sx={{ mt: 3 }} />
            ) : count === 0 ? (
                <Box sx={{ height: 210, display: 'grid', placeItems: 'center', mt: 3 }}>
                    <Typography color="text.secondary">No sales in this period</Typography>
                </Box>
            ) : (
                <>
                    <Box
                        className="dash-carousel"
                        role="group"
                        aria-roledescription="carousel"
                        aria-label="Top selling products"
                        tabIndex={0}
                        onKeyDown={onKeyDown}
                    >
                        <Box className="dash-stage">
                            {slots.map((k) => {
                                const offset = k - index;
                                const visible =
                                    offset === 0 ||
                                    (offset === 1 && count >= 2) ||
                                    (offset === -1 && count >= 3);
                                const product = items[mod(k)];
                                return (
                                    <button
                                        key={k}
                                        type="button"
                                        className={`dash-slide${offset === 0 ? ' active' : ''}`}
                                        style={{
                                            transform:
                                                `translate(calc(-50% + ` +
                                                `${offset * SLIDE_SHIFT}px), -50%) ` +
                                                `scale(${offset === 0 ? 1 : 0.7})`,
                                            opacity: visible ? (offset === 0 ? 1 : 0.75) : 0,
                                            zIndex: offset === 0 ? 2 : 1,
                                        }}
                                        disabled={offset === 0 || !visible}
                                        aria-hidden={!visible}
                                        aria-label={`Show ${product.name}`}
                                        onClick={() => setIndex(k)}
                                    >
                                        <ProductImage src={product.image} name={product.name} />
                                    </button>
                                );
                            })}
                        </Box>

                        {count > 1 && (
                            <>
                                <IconButton
                                    size="small"
                                    className="dash-carousel-arrow left"
                                    aria-label="Previous product"
                                    onClick={() => setIndex(index - 1)}
                                >
                                    <ChevronLeftRoundedIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    className="dash-carousel-arrow right"
                                    aria-label="Next product"
                                    onClick={() => setIndex(index + 1)}
                                >
                                    <ChevronRightRoundedIcon fontSize="small" />
                                </IconButton>
                            </>
                        )}
                    </Box>

                    {/* key makes the text fade in again each time the product changes */}
                    <Box key={current} className="dash-caption">
                        <Chip
                            size="small"
                            variant="outlined"
                            label={`# ${current + 1} TOP SELLER`}
                            sx={{ mb: 1, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.6)' }}
                        />
                        <Typography sx={{ fontWeight: 700 }} noWrap>
                            {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {item.unitsSold} sold · {peso(item.total)}
                        </Typography>
                    </Box>

                    {count > 1 && (
                        <Box className="dash-dots">
                            {items.map((product, i) => (
                                <button
                                    key={`${product.name}-${i}`}
                                    type="button"
                                    className={`dash-dot${i === current ? ' active' : ''}`}
                                    aria-label={`Show ${product.name}`}
                                    onClick={() => setIndex(index + (i - current))}
                                />
                            ))}
                        </Box>
                    )}
                </>
            )}
        </Paper>
    );
}

// ---------- page ----------
export default function Dashboard() {
    const { user } = useSelector((state) => state.auth);

    // this year by default
    const [range, setRange] = useState(() => PRESETS.find((p) => p.id === 'ytd').range());
    const [chartType, setChartType] = useState('line');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const rangeError =
        range.from && range.to && range.from > range.to
            ? 'Start date must be on or before the end date'
            : '';
    const rangeReady = Boolean(range.from && range.to) && !rangeError;

    useEffect(() => {
        if (!rangeReady) return undefined;
        let cancelled = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        api.get('/admin/dashboard', { params: { from: range.from, to: range.to } })
            .then(({ data }) => !cancelled && setStats(data))
            .catch(
                (err) =>
                    !cancelled &&
                    notifyError(err.response?.data?.message || 'Could not load the dashboard'),
            )
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [range.from, range.to, rangeReady]);

    const activePreset = useMemo(
        () =>
            PRESETS.find((p) => {
                const r = p.range();
                return r.from === range.from && r.to === range.to;
            })?.id ?? null,
        [range.from, range.to],
    );

    const hasSales = stats?.salesOverTime.some((b) => b.total > 0);
    const initialLoad = loading && !stats;
    const previous = stats?.previous;
    const salesDiff = stats && previous ? stats.totalSales - previous.totalSales : 0;
    const salesChange = stats && previous ? pctChange(stats.totalSales, previous.totalSales) : 0;
    const firstName = user?.name?.split(' ')[0] ?? 'there';
    const dataLength = stats?.salesOverTime.length ?? 0;

    return (
        <>
            {/* Top bar: greeting on the left, date + account menu on the right */}
            <Box className="dash-header">
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                        {greeting()}, {firstName}!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Here&apos;s what&apos;s happening with your store today
                    </Typography>
                </Box>

                <Box className="dash-header-right">
                    <Box className="dash-date" sx={{ color: 'text.secondary' }}>
                        <CalendarMonthOutlinedIcon sx={{ fontSize: 18 }} />
                        <Typography component="span" sx={{ fontSize: 14 }}>
                            {new Date().toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </Typography>
                    </Box>
                    <UserMenu user={user} />
                </Box>
            </Box>

            {/* KPI cards */}
            <Box className="dash-stats">
                <StatCard
                    label="Total products"
                    value={stats?.totalProducts ?? 0}
                    icon={<Inventory2OutlinedIcon />}
                    loading={initialLoad}
                />
                <StatCard
                    label="Completed orders"
                    value={stats?.completedOrders ?? 0}
                    icon={<AssignmentTurnedInOutlinedIcon />}
                    change={
                        stats && previous
                            ? pctChange(stats.completedOrders, previous.completedOrders)
                            : undefined
                    }
                    loading={initialLoad}
                />
                <StatCard
                    label="Cancelled orders"
                    value={stats?.cancelledOrders ?? 0}
                    icon={<CancelOutlinedIcon />}
                    change={
                        stats && previous
                            ? pctChange(stats.cancelledOrders, previous.cancelledOrders)
                            : undefined
                    }
                    invert
                    loading={initialLoad}
                />
                <StatCard
                    label="Customers"
                    value={stats?.totalUsers ?? 0}
                    icon={<PeopleOutlinedIcon />}
                    loading={initialLoad}
                />
            </Box>

            {/* Sales report */}
            <Box className="dash-report">
                {loading && stats && (
                    <LinearProgress
                        color="secondary"
                        sx={{ position: 'absolute', inset: '0 0 auto 0' }}
                    />
                )}

                <Box className="dash-report-side">
                    <Box>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                            Your sales report
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {stats
                                ? `${formatDate(stats.from)} – ${formatDate(stats.to)}`
                                : 'Pick a date range'}
                        </Typography>
                    </Box>

                    <Box sx={{ my: 3 }}>
                        {initialLoad ? (
                            <Skeleton width={220} height={64} />
                        ) : (
                            <Typography
                                component="p"
                                sx={{
                                    fontSize: { xs: 36, md: 44 },
                                    fontWeight: 400,
                                    lineHeight: 1.1,
                                    letterSpacing: '-0.02em',
                                    color: '#12141c',
                                }}
                            >
                                {peso(stats?.totalSales ?? 0)}
                            </Typography>
                        )}
                        {stats && previous && (
                            <Box sx={{ mt: 1.5 }}>
                                <SalesDelta diff={salesDiff} percent={salesChange} />
                            </Box>
                        )}
                        {stats && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {stats.totalOrders} orders · avg. {peso(stats.averageOrderValue)}
                            </Typography>
                        )}
                    </Box>

                    <Box className="dash-presets">
                        {PRESETS.map((p) => (
                            <Button
                                key={p.id}
                                size="small"
                                disableElevation
                                variant={activePreset === p.id ? 'contained' : 'text'}
                                color={activePreset === p.id ? 'primary' : 'inherit'}
                                onClick={() => setRange(p.range())}
                                sx={{
                                    borderRadius: 99,
                                    minWidth: 0,
                                    px: 1.75,
                                    fontWeight: 500,
                                    color: activePreset === p.id ? undefined : NEUTRAL,
                                }}
                            >
                                {p.label}
                            </Button>
                        ))}
                    </Box>
                </Box>

                <Box className="dash-report-chart">
                    {/* Date range filter + chart type */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'flex-start',
                            justifyContent: 'flex-end',
                            gap: 1.5,
                            mb: 2,
                        }}
                    >
                        <TextField
                            label="From"
                            type="date"
                            size="small"
                            value={range.from}
                            error={Boolean(rangeError)}
                            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: { max: range.to || undefined },
                            }}
                        />
                        <TextField
                            label="To"
                            type="date"
                            size="small"
                            value={range.to}
                            error={Boolean(rangeError)}
                            helperText={rangeError}
                            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: { min: range.from || undefined },
                            }}
                        />
                        <ToggleButtonGroup
                            exclusive
                            size="small"
                            value={chartType}
                            onChange={(_, value) => value && setChartType(value)}
                            aria-label="Chart type"
                            sx={{ height: 40 }}
                        >
                            <ToggleButton value="line" aria-label="Line chart">
                                <ShowChartIcon fontSize="small" />
                            </ToggleButton>
                            <ToggleButton value="bar" aria-label="Bar chart">
                                <BarChartIcon fontSize="small" />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {initialLoad ? (
                        <Skeleton variant="rounded" height={300} />
                    ) : !hasSales ? (
                        <Box
                            sx={{
                                height: 300,
                                display: 'grid',
                                placeItems: 'center',
                                textAlign: 'center',
                            }}
                        >
                            <Box>
                                <ShowChartIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                                <Typography color="text.secondary">
                                    No sales in this period
                                </Typography>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <ComposedChart
                                    data={stats.salesOverTime}
                                    margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop
                                                offset="0%"
                                                stopColor={SALES_COLOR}
                                                stopOpacity={0.18}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor={SALES_COLOR}
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 6"
                                        horizontal={false}
                                        stroke="#d9dce2"
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={24}
                                        tick={{ fill: NEUTRAL, fontSize: 12 }}
                                    />
                                    <YAxis
                                        yAxisId="sales"
                                        hide
                                        domain={[0, (max) => Math.ceil(max * 1.2) || 1]}
                                    />
                                    <YAxis
                                        yAxisId="orders"
                                        orientation="right"
                                        hide
                                        domain={[0, (max) => Math.ceil(max * 1.4) || 1]}
                                    />
                                    <Tooltip
                                        content={<SalesTooltip />}
                                        cursor={{ stroke: '#c5c9d1', strokeDasharray: '3 3' }}
                                    />

                                    {chartType === 'line' && (
                                        <Area
                                            yAxisId="sales"
                                            type="monotone"
                                            dataKey="total"
                                            name="Sales"
                                            stroke={SALES_COLOR}
                                            strokeWidth={2.5}
                                            fill="url(#salesFill)"
                                            dot={dataLength <= 31}
                                            activeDot={{ r: 5 }}
                                        />
                                    )}
                                    {chartType === 'line' && (
                                        <Line
                                            yAxisId="orders"
                                            type="monotone"
                                            dataKey="orders"
                                            name="Orders"
                                            stroke={ORDERS_COLOR}
                                            strokeWidth={2.5}
                                            dot={false}
                                            activeDot={{ r: 5 }}
                                        />
                                    )}
                                    {chartType === 'bar' && (
                                        <Bar
                                            yAxisId="sales"
                                            dataKey="total"
                                            name="Sales"
                                            fill={SALES_COLOR}
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={28}
                                        />
                                    )}
                                    {chartType === 'bar' && (
                                        <Bar
                                            yAxisId="orders"
                                            dataKey="orders"
                                            name="Orders"
                                            fill={ORDERS_COLOR}
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={28}
                                        />
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Last transactions + top sellers */}
            <Box className="dash-bottom">
                <Box sx={{ minWidth: 0 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 1,
                        }}
                    >
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                            Last transactions
                        </Typography>
                        <Button
                            component={Link}
                            to="/admin/orders"
                            size="small"
                            color="inherit"
                            sx={{ color: NEUTRAL }}
                        >
                            View all
                        </Button>
                    </Box>

                    {initialLoad ? (
                        <Skeleton variant="rounded" height={260} />
                    ) : stats?.recentOrders.length === 0 ? (
                        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                            No orders in this period
                        </Typography>
                    ) : (
                        <TableContainer>
                            <Table size="medium" className="dash-table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Order ID</TableCell>
                                        <TableCell>Item</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Total</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stats?.recentOrders.map((order) => (
                                        <TableRow key={order._id} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>
                                                <Link
                                                    to={`/admin/order/${order._id}`}
                                                    className="dash-order-link"
                                                >
                                                    {order.orderId}
                                                </Link>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 200 }}>
                                                <Typography variant="body2" noWrap>
                                                    {order.item}
                                                </Typography>
                                            </TableCell>
                                            <TableCell
                                                sx={{ whiteSpace: 'nowrap', color: NEUTRAL }}
                                            >
                                                {formatDate(order.createdAt)}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>
                                                {peso(order.totalPrice)}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    label={order.status}
                                                    color={STATUS_COLORS[order.status] ?? 'default'}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>

                <TopSellers items={stats?.productSales ?? []} loading={initialLoad} />
            </Box>
        </>
    );
}

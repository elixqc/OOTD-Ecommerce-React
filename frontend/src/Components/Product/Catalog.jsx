import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Badge,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    InputAdornment,
    MenuItem,
    TextField,
    Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import api from '../../api';
import { getProducts, loadMoreProducts } from '../../actions/productActions';
import { peso } from '../../Utils/helpers';
import FilterDrawer from './FilterDrawer';
import ProductCard from './ProductCard';

const emptyFilters = {
    keyword: '',
    category: 'All',
    minPrice: '',
    maxPrice: '',
    rating: 'All',
    minReviews: 'All',
    sort: 'newest',
};

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top rated' },
    { value: 'popular', label: 'Most reviewed' },
];

const priceLabel = ({ minPrice, maxPrice }) => {
    if (minPrice !== '' && maxPrice !== '') return `${peso(Number(minPrice))} – ${peso(Number(maxPrice))}`;
    if (minPrice !== '') return `${peso(Number(minPrice))} and up`;
    return `Up to ${peso(Number(maxPrice))}`;
};

export default function Catalog() {
    const dispatch = useDispatch();
    const { products, loading, error, hasMore, page, total } = useSelector((state) => state.catalog);

    const [filters, setFilters] = useState(emptyFilters);
    const [searchText, setSearchText] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [maxPrice, setMaxPrice] = useState(0);
    const sentinel = useRef(null);

    // Search applies by itself shortly after typing stops, so there is no Apply button to press
    useEffect(() => {
        const timer = setTimeout(() => {
            const keyword = searchText.trim();
            setFilters((prev) => (prev.keyword === keyword ? prev : { ...prev, keyword }));
        }, 400);
        return () => clearTimeout(timer);
    }, [searchText]);

    // Highest price in the shop, used as the end of the price slider in the filter drawer
    useEffect(() => {
        api.get('/products/max-price')
            .then(({ data }) => setMaxPrice(data.maxPrice))
            .catch(() => {});
    }, []);

    // First page, and again whenever the applied filters or sort change
    useEffect(() => {
        dispatch(getProducts(filters, 1));
    }, [dispatch, filters]);

    // Infinite scroll. It re-subscribes after every load, so it keeps loading
    // if the bottom is still visible (for example on a tall screen).
    useEffect(() => {
        const node = sentinel.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) dispatch(loadMoreProducts(filters));
            },
            { rootMargin: '300px' }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [dispatch, filters, hasMore, loading, page]);

    // One removable chip for each filter that is switched on (search and sort have their own controls)
    const activeChips = useMemo(() => {
        const chips = [];
        if (filters.category !== 'All') chips.push({ key: 'category', label: filters.category, reset: { category: 'All' } });
        if (filters.minPrice !== '' || filters.maxPrice !== '')
            chips.push({ key: 'price', label: priceLabel(filters), reset: { minPrice: '', maxPrice: '' } });
        if (filters.rating !== 'All') chips.push({ key: 'rating', label: `${filters.rating}★ & up`, reset: { rating: 'All' } });
        if (filters.minReviews !== 'All')
            chips.push({
                key: 'reviews',
                label: filters.minReviews === '1' ? 'Has reviews' : `${filters.minReviews}+ reviews`,
                reset: { minReviews: 'All' },
            });
        return chips;
    }, [filters]);

    const removeChip = (reset) => setFilters((prev) => ({ ...prev, ...reset }));

    const clearAll = () => {
        setSearchText('');
        setFilters({ ...emptyFilters, sort: filters.sort });
    };

    const hasAnyFilter = activeChips.length > 0 || filters.keyword !== '';

    return (
        <section>
            <div className="catalog-heading">
                <Typography variant="h5" component="h2">
                    Shop
                </Typography>
                {page > 0 && !error && (
                    <Typography color="text.secondary">
                        {total} {total === 1 ? 'product' : 'products'}
                    </Typography>
                )}
            </div>

            <div className="catalog-toolbar">
                <TextField
                    className="catalog-search"
                    placeholder="Search by name, brand, or category"
                    size="small"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    slotProps={{
                        htmlInput: { 'aria-label': 'Search products' },
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                            endAdornment: searchText && (
                                <InputAdornment position="end">
                                    <IconButton size="small" aria-label="Clear search" onClick={() => setSearchText('')}>
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />

                <Badge badgeContent={activeChips.length} color="secondary">
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<TuneIcon />}
                        onClick={() => setDrawerOpen(true)}
                        sx={{ height: 40 }}
                    >
                        Filter
                    </Button>
                </Badge>

                <TextField
                    select
                    size="small"
                    className="catalog-sort"
                    value={filters.sort}
                    onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
                    slotProps={{ htmlInput: { 'aria-label': 'Sort products' } }}
                >
                    {SORT_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            Sort: {option.label}
                        </MenuItem>
                    ))}
                </TextField>
            </div>

            {hasAnyFilter && (
                <div className="catalog-chips">
                    {filters.keyword && (
                        <Chip label={`“${filters.keyword}”`} onDelete={() => setSearchText('')} />
                    )}
                    {activeChips.map((chip) => (
                        <Chip key={chip.key} label={chip.label} onDelete={() => removeChip(chip.reset)} />
                    ))}
                    <Button size="small" color="secondary" onClick={clearAll}>
                        Clear all
                    </Button>
                </div>
            )}

            <FilterDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                applied={filters}
                onApply={(next) => setFilters({ ...next, keyword: filters.keyword, sort: filters.sort })}
                emptyFilters={emptyFilters}
                maxPrice={maxPrice}
            />

            {error && (
                <div className="catalog-message">
                    <Typography color="error">{error}</Typography>
                    <Button onClick={() => dispatch(getProducts(filters, page + 1))}>Try again</Button>
                </div>
            )}

            <div className="product-grid">
                {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                ))}
            </div>

            {loading && (
                <div className="catalog-message">
                    <CircularProgress />
                </div>
            )}
            {!loading && !error && page > 0 && products.length === 0 && (
                <div className="catalog-message">
                    <Typography>No products match your search.</Typography>
                    {hasAnyFilter && (
                        <Button color="secondary" onClick={clearAll}>
                            Clear all filters
                        </Button>
                    )}
                </div>
            )}
            {!loading && !error && !hasMore && products.length > 0 && (
                <Typography className="catalog-message" color="text.secondary">
                    You've reached the end.
                </Typography>
            )}

            <div ref={sentinel} />
        </section>
    );
}
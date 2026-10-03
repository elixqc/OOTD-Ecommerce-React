import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, CircularProgress, MenuItem, TextField, Typography } from '@mui/material';
import { getProducts, loadMoreProducts } from '../../actions/productActions';
import { CATEGORIES } from '../../constants/productConstants';
import { notifyError } from '../../Utils/helpers';
import ProductCard from './ProductCard';

const emptyFilters = { keyword: '', category: 'All', minPrice: '', maxPrice: '', rating: 'All' };

export default function Catalog() {
    const dispatch = useDispatch();
    const { products, loading, error, hasMore, page } = useSelector((state) => state.catalog);

    // draft = what's typed in the form, filters = what was applied with the Apply button
    const [draft, setDraft] = useState(emptyFilters);
    const [filters, setFilters] = useState(emptyFilters);
    const sentinel = useRef(null);

    // First page, and again whenever the applied filters change
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

    const handleChange = (e) => setDraft({ ...draft, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (draft.minPrice !== '' && draft.maxPrice !== '' && Number(draft.minPrice) > Number(draft.maxPrice)) {
            notifyError('Min price cannot be higher than max price');
            return;
        }
        setFilters(draft);
    };

    const handleClear = () => {
        setDraft(emptyFilters);
        setFilters(emptyFilters);
    };

    return (
        <section>
            <Typography variant="h5" component="h2" gutterBottom>
                Shop
            </Typography>

            <form className="catalog-filters" onSubmit={handleSubmit}>
                <TextField
                    name="keyword"
                    label="Search name, brand, or category"
                    size="small"
                    sx={{ width: 130 }}
                    value={draft.keyword}
                    onChange={handleChange}
                />
                <TextField
                    select
                    name="category"
                    label="Category"
                    size="small"
                    sx={{ width: 130 }}
                    className="filter-select"
                    value={draft.category}
                    onChange={handleChange}
                >
                    <MenuItem value="All">All categories</MenuItem>
                    {CATEGORIES.map((category) => (
                        <MenuItem key={category} value={category}>
                            {category}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    name="minPrice"
                    label="Min price"
                    type="number"
                    size="small"
                    value={draft.minPrice}
                    onChange={handleChange}
                />
                <TextField
                    name="maxPrice"
                    label="Max price"
                    type="number"
                    size="small"
                    value={draft.maxPrice}
                    onChange={handleChange}
                />
                <TextField
                    select
                    name="rating"
                    label="Rating"
                    size="small"
                    className="filter-select"
                    value={draft.rating}
                    onChange={handleChange}
                >
                    <MenuItem value="All">Any rating</MenuItem>
                    {[4, 3, 2, 1].map((stars) => (
                        <MenuItem key={stars} value={String(stars)}>
                            {stars} stars &amp; up
                        </MenuItem>
                    ))}
                </TextField>
                <Button type="submit" variant="contained">
                    Apply
                </Button>
                <Button type="button" onClick={handleClear}>
                    Clear
                </Button>
            </form>

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
                <Typography className="catalog-message">No products match your search.</Typography>
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
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Drawer, IconButton, InputBase, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import NorthWestIcon from '@mui/icons-material/NorthWest';
import HistoryIcon from '@mui/icons-material/History';
import api from '../../api';
import { peso } from '../../Utils/helpers';
import { getCardImages } from '../../Utils/productImages';

const RECENT_KEY = 'ootd_recent_searches';
const MAX_RECENT = 6;
const MAX_TERMS = 5;
const MAX_PRODUCTS = 4;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const readRecent = () => {
    try {
        const list = JSON.parse(localStorage.getItem(RECENT_KEY));
        return Array.isArray(list) ? list.slice(0, MAX_RECENT) : [];
    } catch {
        return [];
    }
};

const writeRecent = (list) => {
    try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch {
        /* storage can be blocked, searching still works without it */
    }
};

// Autocomplete lines built from the matching products: the word being typed is completed
// ("blac" -> "Black"), and brand, category and full product names are offered too.
const buildSuggestions = (products, query) => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/);
    const found = new Map(); // lowercase text -> { text, rank }

    const add = (text, rank) => {
        const key = text.toLowerCase();
        if (key === q) return; // that is already what was typed
        const existing = found.get(key);
        if (!existing || rank < existing.rank) found.set(key, { text, rank });
    };

    products.forEach((product) => {
        [product.name, product.brand, product.category, product.gender].forEach((field, fieldIndex) => {
            if (!field) return;
            const lower = field.toLowerCase();
            const at = lower.indexOf(q);

            if (at >= 0) {
                const atWordStart = at === 0 || lower[at - 1] === ' ';
                const wordEnd = lower.indexOf(' ', at + q.length);
                const completion = field.slice(at, wordEnd === -1 ? field.length : wordEnd);
                add(completion, (at === 0 ? 0 : atWordStart ? 1 : 3) + fieldIndex * 0.1);
            }

            // Whole product name, when every typed word starts a word in it ("black tee" finds "Tee - Black")
            const nameWords = lower.split(/[\s-]+/);
            if (fieldIndex === 0 && tokens.every((token) => nameWords.some((word) => word.startsWith(token)))) {
                add(field, at === 0 ? 2 : 4);
            }
        });
    });

    return [...found.values()]
        .sort((a, b) => a.rank - b.rank || a.text.length - b.text.length)
        .slice(0, MAX_TERMS)
        .map((entry) => entry.text);
};

// Splits the text around the typed words. mode "rest" bolds what was NOT typed (the completion),
// mode "match" bolds what was typed.
function Highlight({ text, query, mode }) {
    const words = query.trim().split(/\s+/).filter(Boolean).map(escapeRegex);
    if (!words.length) return text;
    const parts = text.split(new RegExp(`(${words.join('|')})`, 'ig'));
    return parts.map((part, index) => {
        if (!part) return null;
        const isMatch = index % 2 === 1;
        const bold = mode === 'match' ? isMatch : !isMatch;
        return (
            <Box component="span" key={index} sx={{ fontWeight: bold ? 700 : 400 }}>
                {part}
            </Box>
        );
    });
}

const sectionLabelSx = {
    px: 1.5,
    pt: 2,
    pb: 0.75,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#6b6b6b',
};

const rowSx = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    px: 1.5,
    py: 1,
    borderRadius: 1,
    cursor: 'pointer',
    bgcolor: active ? '#f5f5f5' : 'transparent',
});

function SearchPanel({ onClose, inputRef }) {
    const navigate = useNavigate();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ query: '', products: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(-1);
    const [recent, setRecent] = useState(readRecent);

    const q = query.trim();

    // Ask the shop for matches shortly after typing stops. An older answer never replaces a newer one.
    useEffect(() => {
        if (!q) return undefined;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/products', {
                    params: { keyword: q, limit: 12 },
                    signal: controller.signal,
                });
                setResults({ query: q, products: data.products, total: data.total });
            } catch {
                /* cancelled or failed: keep showing the last results */
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [q]);

    const products = useMemo(() => (q ? results.products : []), [q, results.products]);
    const terms = useMemo(() => buildSuggestions(products, q), [products, q]);
    const productRows = useMemo(() => products.slice(0, MAX_PRODUCTS), [products]);
    const settled = results.query === q; // the shown results belong to what is typed now

    // One flat list, so the arrow keys can move through suggestions, products and "see all"
    const items = useMemo(() => {
        if (!q) return recent.map((text) => ({ kind: 'recent', text }));
        return [
            ...terms.map((text) => ({ kind: 'term', text })),
            ...productRows.map((product) => ({ kind: 'product', product })),
            ...(products.length ? [{ kind: 'all' }] : []),
        ];
    }, [q, recent, terms, productRows, products.length]);

    const current = active < items.length ? active : -1;

    const search = (text) => {
        const term = text.trim();
        if (!term) return;
        const next = [term, ...recent.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, MAX_RECENT);
        setRecent(next);
        writeRecent(next);
        navigate(`/?q=${encodeURIComponent(term)}`);
        onClose();
    };

    const run = (item) => {
        if (item.kind === 'product') {
            navigate(`/product/${item.product._id}`);
            onClose();
        } else if (item.kind === 'all') {
            search(q);
        } else {
            search(item.text);
        }
    };

    const fillInput = (text) => {
        setQuery(text);
        setActive(-1);
        inputRef.current?.focus();
    };

    const clearRecent = () => {
        setRecent([]);
        writeRecent([]);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown' && items.length) {
            e.preventDefault();
            setActive((current + 1) % items.length);
        } else if (e.key === 'ArrowUp' && items.length) {
            e.preventDefault();
            setActive(current <= 0 ? items.length - 1 : current - 1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (current >= 0) run(items[current]);
            else search(q);
        }
    };

    const termCount = q ? terms.length : 0;

    return (
        <Box sx={{ width: '100%', maxWidth: 720, mx: 'auto', px: 'var(--page-gutter)', pb: 2 }}>
            {/* Search box */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    minHeight: { xs: 56, md: 64 },
                    borderBottom: '1px solid',
                    borderColor: '#ececec',
                }}
            >
                <SearchIcon sx={{ color: '#6b6b6b' }} />
                <InputBase
                    inputRef={inputRef}
                    fullWidth
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setActive(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search products"
                    inputProps={{
                        'aria-label': 'Search products',
                        role: 'combobox',
                        'aria-expanded': items.length > 0,
                        'aria-controls': 'search-results',
                        'aria-activedescendant': current >= 0 ? `search-item-${current}` : undefined,
                        autoComplete: 'off',
                        enterKeyHint: 'search',
                    }}
                    sx={{ fontSize: 17, '& input::placeholder': { opacity: 0.55 } }}
                />
                {loading && <CircularProgress size={18} thickness={5} color="inherit" sx={{ color: '#9a9a9a', flexShrink: 0 }} />}
                {query && (
                    <IconButton size="small" aria-label="Clear search" onClick={() => fillInput('')}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                )}
                <Typography
                    component="button"
                    type="button"
                    onClick={onClose}
                    sx={{
                        border: 0,
                        bgcolor: 'transparent',
                        cursor: 'pointer',
                        color: 'inherit',
                        font: 'inherit',
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        px: 1,
                        '&:hover': { opacity: 0.6 },
                    }}
                >
                    Close
                </Typography>
            </Box>

            {/* Results */}
            <Box id="search-results" role="listbox" sx={{ pt: 0.5 }} onMouseDown={(e) => e.preventDefault()}>
                {/* Nothing typed yet: recent searches */}
                {!q && recent.length > 0 && (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography sx={sectionLabelSx}>Recent searches</Typography>
                            <Typography
                                component="button"
                                type="button"
                                onClick={clearRecent}
                                sx={{
                                    ...sectionLabelSx,
                                    border: 0,
                                    bgcolor: 'transparent',
                                    cursor: 'pointer',
                                    '&:hover': { color: 'var(--brand-dark)' },
                                }}
                            >
                                Clear
                            </Typography>
                        </Box>
                        {recent.map((text, index) => (
                            <Box
                                key={text}
                                id={`search-item-${index}`}
                                role="option"
                                aria-selected={current === index}
                                onMouseEnter={() => setActive(index)}
                                onClick={() => run(items[index])}
                                sx={rowSx(current === index)}
                            >
                                <HistoryIcon sx={{ fontSize: 20, color: '#9a9a9a' }} />
                                <Typography sx={{ flex: 1, fontSize: 14 }} noWrap>
                                    {text}
                                </Typography>
                            </Box>
                        ))}
                    </>
                )}

                {!q && recent.length === 0 && (
                    <Typography sx={{ px: 1.5, py: 3, fontSize: 14, color: '#6b6b6b' }}>
                        Search by product name, brand or category.
                    </Typography>
                )}

                {/* Typed something: suggestions, then products */}
                {q && terms.length > 0 && (
                    <>
                        <Typography sx={sectionLabelSx}>Suggestions</Typography>
                        {terms.map((text, index) => (
                            <Box
                                key={text}
                                id={`search-item-${index}`}
                                role="option"
                                aria-selected={current === index}
                                onMouseEnter={() => setActive(index)}
                                onClick={() => run(items[index])}
                                sx={rowSx(current === index)}
                            >
                                <SearchIcon sx={{ fontSize: 20, color: '#9a9a9a' }} />
                                <Typography sx={{ flex: 1, fontSize: 14 }} noWrap>
                                    <Highlight text={text} query={q} mode="rest" />
                                </Typography>
                                <IconButton
                                    size="small"
                                    aria-label={`Use "${text}"`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fillInput(text);
                                    }}
                                    sx={{ color: '#9a9a9a', '&:hover': { color: 'var(--brand-dark)', bgcolor: 'transparent' } }}
                                >
                                    <NorthWestIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                    </>
                )}

                {q && productRows.length > 0 && (
                    <>
                        <Typography sx={sectionLabelSx}>Products</Typography>
                        {productRows.map((product, index) => {
                            const position = termCount + index;
                            const { cover } = getCardImages(product);
                            return (
                                <Box
                                    key={product._id}
                                    id={`search-item-${position}`}
                                    role="option"
                                    aria-selected={current === position}
                                    onMouseEnter={() => setActive(position)}
                                    onClick={() => run(items[position])}
                                    sx={rowSx(current === position)}
                                >
                                    <Box
                                        component="img"
                                        src={cover}
                                        alt=""
                                        sx={{ width: 44, height: 56, objectFit: 'cover', bgcolor: '#f3f3f3', borderRadius: 0.5, flexShrink: 0 }}
                                    />
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography sx={{ fontSize: 14 }} noWrap>
                                            <Highlight text={product.name} query={q} mode="match" />
                                        </Typography>
                                        <Typography sx={{ fontSize: 13, color: '#6b6b6b' }}>
                                            {peso(product.price)}
                                            {product.totalStock === 0 && ' · Sold out'}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}

                        <Box
                            id={`search-item-${items.length - 1}`}
                            role="option"
                            aria-selected={current === items.length - 1}
                            onMouseEnter={() => setActive(items.length - 1)}
                            onClick={() => run(items[items.length - 1])}
                            sx={{ ...rowSx(current === items.length - 1), mt: 1, justifyContent: 'space-between' }}
                        >
                            <Typography
                                sx={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                See all {results.total} result{results.total === 1 ? '' : 's'} for “{q}”
                            </Typography>
                            <NorthWestIcon sx={{ fontSize: 18, transform: 'rotate(90deg)' }} />
                        </Box>
                    </>
                )}

                {q && settled && !loading && products.length === 0 && (
                    <Box sx={{ px: 1.5, py: 3 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>No results for “{q}”</Typography>
                        <Typography sx={{ fontSize: 13, color: '#6b6b6b', mt: 0.5 }}>
                            Check the spelling or try a different keyword.
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

// Full-width panel that drops down over the header. The panel is only mounted while open,
// so the text and the results start fresh every time it opens.
export default function SearchOverlay({ open, onClose }) {
    const inputRef = useRef(null);

    return (
        <Drawer
            anchor="top"
            open={open}
            onClose={onClose}
            transitionDuration={{ enter: 250, exit: 180 }}
            slotProps={{
                // Focus the box as the panel slides in, so the shopper can type right away
                transition: { onEntering: () => inputRef.current?.focus() },
                backdrop: { sx: { backgroundColor: 'rgba(0, 0, 0, 0.25)' } },
                paper: {
                    sx: {
                        color: 'primary.main',
                        bgcolor: '#fff',
                        maxHeight: '85vh',
                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)',
                    },
                },
            }}
        >
            <SearchPanel onClose={onClose} inputRef={inputRef} />
        </Drawer>
    );
}
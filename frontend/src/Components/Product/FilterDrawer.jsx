// MP2 · Filters — the four filters UI.
// Price slider + category/rating/reviews radios; passes the chosen values up to Catalog as params.
import { useEffect, useState } from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Chip,
    Drawer,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Radio,
    RadioGroup,
    Slider,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import api from '../../api';
import { buildProductParams } from '../../actions/productActions';
import { CATEGORIES, GENDERS } from '../../constants/productConstants';

const REVIEW_OPTIONS = [
    { value: 'All', label: 'Any number' },
    { value: '1', label: 'Has reviews' },
    { value: '5', label: '5+ reviews' },
    { value: '10', label: '10+ reviews' },
];

// One collapsible section with the round chevron button
function Section({ id, title, open, onToggle, children }) {
    return (
        <Accordion
            disableGutters
            square
            elevation={0}
            expanded={open}
            onChange={() => onToggle(id)}
            className="filter-accordion"
        >
            <AccordionSummary
                expandIcon={
                    <span className="filter-chevron">
                        <ExpandMoreIcon fontSize="small" />
                    </span>
                }
            >
                <Typography className="filter-section-title">{title}</Typography>
            </AccordionSummary>
            <AccordionDetails>{children}</AccordionDetails>
        </Accordion>
    );
}

// Slide-in filter panel. Nothing applies until "Show items" is pressed.
export default function FilterDrawer({ open, onClose, applied, onApply, emptyFilters, maxPrice }) {
    return (
        <Drawer
            anchor="left"
            open={open}
            onClose={onClose}
            slotProps={{ paper: { className: 'filter-drawer' } }}
        >
            {/* Only mounted while open, so the draft starts from what is applied */}
            <FilterPanel
                onClose={onClose}
                applied={applied}
                onApply={onApply}
                emptyFilters={emptyFilters}
                maxPrice={maxPrice}
            />
        </Drawer>
    );
}

function FilterPanel({ onClose, applied, onApply, emptyFilters, maxPrice }) {
    const [draft, setDraft] = useState(applied);
    const [result, setResult] = useState({ key: '', total: null });
    const [openSections, setOpenSections] = useState([]);

    const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));
    const toggleSection = (id) =>
        setOpenSections((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
        );

    // Empty price means "no limit": 0 in the field, highest price on the slider
    const minValue = draft.minPrice === '' ? 0 : Number(draft.minPrice);
    const maxValue = draft.maxPrice === '' ? maxPrice : Number(draft.maxPrice);
    const priceError = minValue > maxValue;

    const handleSlider = (_, [low, high]) => {
        setDraft((prev) => ({
            ...prev,
            minPrice: low <= 0 ? '' : String(low),
            maxPrice: high >= maxPrice ? '' : String(high),
        }));
    };

    // Live item count for the bottom button, stored with the filters it was fetched for
    const filterKey = JSON.stringify(buildProductParams(draft));
    const count = !priceError && result.key === filterKey ? result.total : null;

    useEffect(() => {
        if (priceError) return;
        let ignore = false;
        const timer = setTimeout(async () => {
            try {
                const { data } = await api.get('/products', {
                    params: { ...JSON.parse(filterKey), limit: 1 },
                });
                if (!ignore) setResult({ key: filterKey, total: data.total });
            } catch {
                if (!ignore) setResult({ key: '', total: null });
            }
        }, 300);
        return () => {
            ignore = true;
            clearTimeout(timer);
        };
    }, [filterKey, priceError]);

    const handleClearAll = () =>
        setDraft({ ...emptyFilters, keyword: applied.keyword, sort: applied.sort });

    const handleApply = () => {
        // Slider ends are not filters, so drop them
        onApply({
            ...draft,
            minPrice: minValue <= 0 ? '' : String(minValue),
            maxPrice: maxValue >= maxPrice ? '' : String(maxValue),
        });
        onClose();
    };

    const buttonLabel =
        count === null
            ? 'Show items'
            : count === 0
              ? 'No items found'
              : `Show ${count} item${count === 1 ? '' : 's'}`;

    const priceField = (label, value, onChange) => (
        <TextField
            label={label}
            type="number"
            size="small"
            fullWidth
            value={value}
            onChange={onChange}
            onFocus={(e) => e.target.select()}
            error={priceError}
            slotProps={{
                input: { startAdornment: <InputAdornment position="start">₱</InputAdornment> },
                htmlInput: { min: 0, max: maxPrice || undefined },
            }}
        />
    );

    return (
        <>
            <div className="filter-drawer-header">
                <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
                    Filters
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Button size="small" color="secondary" onClick={handleClearAll}>
                        Clear filters
                    </Button>
                    <IconButton aria-label="Close filters" onClick={onClose} edge="end">
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </div>

            <div className="filter-drawer-body">
                <Section
                    id="category"
                    title="Category"
                    open={openSections.includes('category')}
                    onToggle={toggleSection}
                >
                    <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
                        {['All', ...CATEGORIES].map((category) => (
                            <Chip
                                key={category}
                                label={category === 'All' ? 'All categories' : category}
                                clickable
                                variant={draft.category === category ? 'filled' : 'outlined'}
                                color={draft.category === category ? 'primary' : 'default'}
                                onClick={() => set('category', category)}
                            />
                        ))}
                    </Stack>
                </Section>

                <Section
                    id="gender"
                    title="Gender"
                    open={openSections.includes('gender')}
                    onToggle={toggleSection}
                >
                    <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
                        {['All', ...GENDERS].map((gender) => (
                            <Chip
                                key={gender}
                                label={gender === 'All' ? 'All genders' : gender}
                                clickable
                                variant={draft.gender === gender ? 'filled' : 'outlined'}
                                color={draft.gender === gender ? 'primary' : 'default'}
                                onClick={() => set('gender', gender)}
                            />
                        ))}
                    </Stack>
                </Section>

                <Section
                    id="price"
                    title="Price"
                    open={openSections.includes('price')}
                    onToggle={toggleSection}
                >
                    <Slider
                        value={[Math.min(minValue, maxPrice), Math.min(maxValue, maxPrice)]}
                        onChange={handleSlider}
                        min={0}
                        max={maxPrice}
                        step={1}
                        disabled={maxPrice === 0}
                        disableSwap
                        color="primary"
                        sx={{ mx: 1, width: 'calc(100% - 16px)' }}
                        getAriaLabel={() => 'Price range'}
                    />
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
                        {priceField('Min', minValue, (e) => set('minPrice', e.target.value))}
                        <Typography color="text.secondary">to</Typography>
                        {priceField('Max', maxValue, (e) => set('maxPrice', e.target.value))}
                    </Stack>
                    {priceError && (
                        <Typography
                            variant="caption"
                            color="error"
                            sx={{ display: 'block', mt: 1 }}
                        >
                            Min price is higher than max price
                        </Typography>
                    )}
                </Section>

                <Section
                    id="rating"
                    title="Rating"
                    open={openSections.includes('rating')}
                    onToggle={toggleSection}
                >
                    <RadioGroup
                        value={draft.rating}
                        onChange={(e) => set('rating', e.target.value)}
                    >
                        <FormControlLabel
                            value="All"
                            control={<Radio size="small" color="default" />}
                            label="Any rating"
                        />
                        {[4, 3, 2, 1].map((stars) => (
                            <FormControlLabel
                                key={stars}
                                value={String(stars)}
                                control={<Radio size="small" color="default" />}
                                label={
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <StarRoundedIcon
                                                key={i}
                                                fontSize="small"
                                                sx={{
                                                    color: i < stars ? 'secondary.main' : 'divider',
                                                }}
                                            />
                                        ))}
                                        <Typography variant="body2" color="text.secondary">
                                            &amp; up
                                        </Typography>
                                    </Stack>
                                }
                            />
                        ))}
                    </RadioGroup>
                </Section>

                <Section
                    id="reviews"
                    title="Reviews"
                    open={openSections.includes('reviews')}
                    onToggle={toggleSection}
                >
                    <RadioGroup
                        value={draft.minReviews}
                        onChange={(e) => set('minReviews', e.target.value)}
                    >
                        {REVIEW_OPTIONS.map((option) => (
                            <FormControlLabel
                                key={option.value}
                                value={option.value}
                                control={<Radio size="small" color="default" />}
                                label={option.label}
                            />
                        ))}
                    </RadioGroup>
                </Section>
            </div>

            <div className="filter-drawer-footer">
                <Button
                    fullWidth
                    size="large"
                    variant="contained"
                    disabled={priceError || count === 0}
                    onClick={handleApply}
                >
                    {buttonLabel}
                </Button>
            </div>
        </>
    );
}

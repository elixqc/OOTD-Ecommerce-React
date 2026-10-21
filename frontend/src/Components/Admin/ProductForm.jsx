// MP1 · Product CRUD + U1-B · Validation — shared create/edit product form.
// Formik + Yup validated; collects basics, variants and photos, then posts/puts to the admin product API.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    Alert,
    Box,
    Button,
    Divider,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import {
    ACCEPTED_IMAGE_TYPES,
    CATEGORIES,
    GENDERS,
    MAX_FILE_SIZE,
    MAX_IMAGES_PER_COLOR,
} from '../../constants/productConstants';
import { discardUploadedImage, uploadProductImage } from '../../actions/productActions';
import { notifyError } from '../../Utils/helpers';
import { prepareImage } from '../../Utils/imageFile';
import ColorImageUploader from './ColorImageUploader';

const BORDER = '#eceef2';
const NEUTRAL = '#8a8f98';

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px' } };

// A white rounded panel with a title, the same look as the dashboard and products page
function Section({ title, subtitle, children, sx }) {
    return (
        <Paper
            elevation={0}
            sx={{ p: { xs: 2, md: 3 }, border: `1px solid ${BORDER}`, borderRadius: '16px', ...sx }}
        >
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700, fontSize: 17 }}>
                {title}
            </Typography>
            {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {subtitle}
                </Typography>
            )}
            <Box sx={{ mt: 2.5 }}>{children}</Box>
        </Paper>
    );
}

function SummaryRow({ label, value }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {value}
            </Typography>
        </Box>
    );
}

const validationSchema = Yup.object({
    name: Yup.string()
        .trim()
        .min(2, 'Product name must be at least 2 characters')
        .max(100, 'Product name cannot exceed 100 characters')
        .required('Product name is required'),
    description: Yup.string()
        .trim()
        .min(10, 'Description must be at least 10 characters')
        .required('Description is required'),
    price: Yup.number()
        .typeError('Price must be a number')
        .min(0, 'Price cannot be negative')
        .max(1000000, 'Price is too high')
        .required('Price is required'),
    category: Yup.string()
        .oneOf(CATEGORIES, 'Please select a category')
        .required('Please select a category'),
    brand: Yup.string().trim().max(50, 'Brand is too long'),
    gender: Yup.string()
        .oneOf(GENDERS, 'Please select a gender')
        .required('Please select a gender'),
    material: Yup.string().trim().max(100, 'Material is too long'),
    variants: Yup.array()
        .of(
            Yup.object({
                size: Yup.string().trim().required('Size is required'),
                colorId: Yup.string().required('Choose a color'),
                stock: Yup.number()
                    .typeError('Stock must be a number')
                    .integer('Whole numbers only')
                    .min(0, 'Cannot be negative')
                    .required('Stock is required'),
            }),
        )
        .min(1, 'Add at least one size/color variant')
        .test(
            'unique-variants',
            'Each size and color combination can only appear once',
            (variants = []) => {
                const keys = variants.map(
                    (v) => `${(v.size || '').trim().toLowerCase()}|${v.colorId}`,
                );
                return new Set(keys).size === keys.length;
            },
        ),
});

let idCounter = 0;
const newId = () => `c${Date.now()}${idCounter++}`;

// Colors the form edits. Each has its own photos. Variants point at a color by id,
// so renaming a color never loses its photos or breaks its sizes.
const getInitialColors = (product) => {
    if (!product) return [{ id: newId(), name: '', images: [] }];

    const colors = [];
    const add = (name, images = []) => {
        if (!colors.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
            colors.push({
                id: newId(),
                name: name.trim(),
                images: images.map((img) => ({
                    key: img.public_id,
                    public_id: img.public_id,
                    url: img.url,
                })),
            });
        }
    };
    (product.colorImages || []).forEach((c) => add(c.color, c.images));
    product.variants.forEach((v) => add(v.color));
    return colors;
};

const getInitialValues = (product, colors) => ({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price ?? '',
    category: product?.category || '',
    brand: product?.brand || '',
    gender: product?.gender || 'Unisex',
    material: product?.material || '',
    variants: product?.variants?.length
        ? product.variants.map((v) => ({
              size: v.size,
              colorId: colors.find((c) => c.name.toLowerCase() === v.color.trim().toLowerCase()).id,
              stock: v.stock,
          }))
        : [{ size: '', colorId: colors[0].id, stock: 0 }],
});

// Used by both NewProduct and UpdateProduct.
// Pass `product` to edit; omit it to create.
export default function ProductForm({ product, onSubmit, submitLabel, loading }) {
    // Photos live outside Formik because they upload in the background and
    // update at different times
    const [colors, setColors] = useState(() => getInitialColors(product));
    const [initialValues] = useState(() => getInitialValues(product, colors));
    const [colorErrors, setColorErrors] = useState({});
    // Always holds the latest colors, for code that runs later (uploads, submit)
    const colorsRef = useRef(colors);
    useEffect(() => {
        colorsRef.current = colors;
    }, [colors]);

    // Uploaded but not saved yet. If the admin leaves without saving, these are
    // deleted from Cloudinary. (The server refuses to delete a photo that belongs
    // to a product, so this is safe after saving.)
    const pending = useRef(new Set());
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        const unsaved = pending.current;
        return () => {
            mounted.current = false;
            unsaved.forEach((publicId) => discardUploadedImage(publicId));
        };
    }, []);

    // Old products only have shared photos; they stay as a fallback for colors without their own
    const hasLegacyPhotos = Boolean(product?.images?.length);
    const uploading = colors.some((c) => c.images.some((i) => i.uploading));

    const formik = useFormik({
        initialValues,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: (values) => {
            const nameOf = (id) => colorsRef.current.find((c) => c.id === id).name.trim();
            const used = new Set(values.variants.map((v) => v.colorId));

            return onSubmit({
                name: values.name.trim(),
                description: values.description.trim(),
                price: Number(values.price),
                category: values.category,
                brand: values.brand.trim(),
                gender: values.gender,
                material: values.material.trim(),
                variants: values.variants.map((v) => ({
                    size: v.size.trim(),
                    color: nameOf(v.colorId),
                    stock: Number(v.stock),
                })),
                colorImages: colorsRef.current
                    .filter((c) => used.has(c.id))
                    .map((c) => ({
                        color: c.name.trim(),
                        images: c.images.map(({ public_id, url }) => ({ public_id, url })),
                    })),
            });
        },
    });

    const { values, errors } = formik;

    const variantError = (index, field) =>
        Array.isArray(errors.variants) ? errors.variants[index]?.[field] : undefined;

    // ---- colors ----
    const updateColor = (id, change) =>
        setColors((prev) => prev.map((c) => (c.id === id ? { ...c, ...change(c) } : c)));

    const addColor = () => setColors((prev) => [...prev, { id: newId(), name: '', images: [] }]);

    const removeColor = (color) => {
        color.images.forEach(
            (img) =>
                img.public_id &&
                pending.current.has(img.public_id) &&
                discardUploadedImage(img.public_id),
        );
        color.images.forEach((img) => pending.current.delete(img.public_id));
        setColors((prev) => prev.filter((c) => c.id !== color.id));
        // Sizes that used this color must pick another one
        formik.setFieldValue(
            'variants',
            values.variants.map((v) => (v.colorId === color.id ? { ...v, colorId: '' } : v)),
        );
    };

    // ---- photos ----
    const handleFiles = async (colorId, files) => {
        const current = colorsRef.current.find((c) => c.id === colorId);
        const room = MAX_IMAGES_PER_COLOR - current.images.length;

        const valid = [];
        for (const file of files) {
            if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                notifyError(`${file.name} is not a JPG, PNG or WebP image`);
            } else if (file.size > MAX_FILE_SIZE) {
                notifyError(`${file.name} is larger than ${MAX_FILE_SIZE / 1024 / 1024} MB`);
            } else {
                valid.push(file);
            }
        }
        if (valid.length > room) {
            notifyError(
                `Only ${MAX_IMAGES_PER_COLOR} photos per color. Extra photos were skipped.`,
            );
        }

        // Show every photo right away with a progress ring, then upload them one by one
        const batch = valid.slice(0, Math.max(room, 0)).map((file) => ({
            file,
            tile: { key: newId(), url: URL.createObjectURL(file), uploading: true, progress: 0 },
        }));
        if (batch.length === 0) return;

        updateColor(colorId, (c) => ({ images: [...c.images, ...batch.map((b) => b.tile)] }));
        setColorErrors((prev) => ({ ...prev, [colorId]: undefined }));

        for (const { file, tile } of batch) {
            const setTile = (change) =>
                updateColor(colorId, (c) => ({
                    images: c.images.map((i) => (i.key === tile.key ? { ...i, ...change } : i)),
                }));
            const dropTile = () =>
                updateColor(colorId, (c) => ({
                    images: c.images.filter((i) => i.key !== tile.key),
                }));

            try {
                const dataUrl = await prepareImage(file);
                const saved = await uploadProductImage(dataUrl, (progress) =>
                    setTile({ progress }),
                );

                if (!mounted.current) {
                    discardUploadedImage(saved.public_id);
                    continue;
                }
                pending.current.add(saved.public_id);
                setTile({
                    key: saved.public_id,
                    public_id: saved.public_id,
                    url: saved.url,
                    uploading: false,
                });
            } catch (err) {
                notifyError(
                    err.response?.data?.message || err.message || `Could not upload ${file.name}`,
                );
                if (mounted.current) dropTile();
            } finally {
                URL.revokeObjectURL(tile.url);
            }
        }
    };

    const removePhoto = (colorId, img) => {
        // A photo uploaded in this session can be deleted right away; saved ones
        // are deleted when the product is saved
        if (pending.current.has(img.public_id)) {
            pending.current.delete(img.public_id);
            discardUploadedImage(img.public_id);
        }
        updateColor(colorId, (c) => ({ images: c.images.filter((i) => i.key !== img.key) }));
    };

    const makeMain = (colorId, img) =>
        updateColor(colorId, (c) => ({
            images: [img, ...c.images.filter((i) => i.key !== img.key)],
        }));

    const reorderPhotos = (colorId, fromKey, toKey) =>
        updateColor(colorId, (c) => {
            const from = c.images.findIndex((i) => i.key === fromKey);
            const to = c.images.findIndex((i) => i.key === toKey);
            if (from === -1 || to === -1 || from === to) return { images: c.images };
            const next = [...c.images];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return { images: next };
        });

    // ---- sizes ----
    const addVariant = () =>
        formik.setFieldValue('variants', [
            ...values.variants,
            { size: '', colorId: colors[0]?.id || '', stock: 0 },
        ]);

    const removeVariant = (index) =>
        formik.setFieldValue(
            'variants',
            values.variants.filter((_, i) => i !== index),
        );

    // ---- submit ----
    const checkColors = () => {
        const found = {};
        const names = new Set();

        colors.forEach((c) => {
            const key = c.name.trim().toLowerCase();
            if (!key) found[c.id] = 'Enter a color name';
            else if (names.has(key)) found[c.id] = 'This color is already added';
            else if (c.images.length === 0 && !hasLegacyPhotos)
                found[c.id] = 'Add at least one photo for this color';
            else if (!values.variants.some((v) => v.colorId === c.id))
                found[c.id] = 'Add a size for this color below';
            names.add(key);
        });
        return found;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (uploading) {
            notifyError('Please wait for the photos to finish uploading');
            return;
        }

        const found = checkColors();
        setColorErrors(found);
        const formErrors = await formik.validateForm();

        if (Object.keys(found).length > 0 || Object.keys(formErrors).length > 0) {
            notifyError('Please fix the highlighted fields');
            return;
        }
        formik.submitForm();
    };

    const colorLabel = (c) => c.name.trim() || 'Unnamed color';

    const totalStock = values.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    const totalPhotos = colors.reduce((sum, c) => sum + c.images.length, 0);

    return (
        <form onSubmit={handleSubmit} noValidate>
            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    alignItems: 'start',
                    gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 340px' },
                }}
            >
                {/* ---------- Left: what the product is ---------- */}
                <Box sx={{ display: 'grid', gap: 3, minWidth: 0 }}>
                    <Section
                        title="Product details"
                        subtitle="The name and description shoppers see in the shop."
                    >
                        <Box sx={{ display: 'grid', gap: 2 }}>
                            <TextField
                                label="Product name"
                                name="name"
                                sx={fieldSx}
                                value={values.name}
                                onChange={formik.handleChange}
                                error={Boolean(errors.name)}
                                helperText={errors.name}
                            />
                            <TextField
                                label="Description"
                                name="description"
                                multiline
                                minRows={4}
                                sx={fieldSx}
                                value={values.description}
                                onChange={formik.handleChange}
                                error={Boolean(errors.description)}
                                helperText={errors.description}
                            />
                        </Box>
                    </Section>

                    <Section
                        title="Colors and photos"
                        subtitle={
                            'Each color gets its own photos. ' +
                            'Shoppers see them when they pick that color.'
                        }
                    >
                        {hasLegacyPhotos && (
                            <Alert severity="info" sx={{ mb: 2, borderRadius: '12px' }}>
                                This product still uses its old shared photos. Colors without their
                                own photos keep showing those.
                            </Alert>
                        )}

                        <Box sx={{ display: 'grid', gap: 2 }}>
                            {colors.map((color) => (
                                <Box
                                    key={color.id}
                                    sx={{
                                        p: 2,
                                        border: '1px solid',
                                        borderColor: colorErrors[color.id] ? 'error.main' : BORDER,
                                        borderRadius: '14px',
                                        bgcolor: '#fafbfc',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 1.5,
                                        }}
                                    >
                                        <TextField
                                            label="Color name"
                                            size="small"
                                            placeholder="e.g. Navy blue"
                                            sx={{
                                                ...fieldSx,
                                                flex: '1 1 auto',
                                                maxWidth: 320,
                                                bgcolor: '#fff',
                                                borderRadius: '12px',
                                            }}
                                            value={color.name}
                                            onChange={(e) => {
                                                const name = e.target.value;
                                                updateColor(color.id, () => ({ name }));
                                                setColorErrors((prev) => ({
                                                    ...prev,
                                                    [color.id]: undefined,
                                                }));
                                            }}
                                            error={
                                                Boolean(colorErrors[color.id]) && !color.name.trim()
                                            }
                                        />
                                        <Tooltip
                                            title={
                                                colors.length === 1
                                                    ? 'A product needs at least one color'
                                                    : 'Remove color'
                                            }
                                        >
                                            <span>
                                                <IconButton
                                                    aria-label={`Remove ${colorLabel(color)}`}
                                                    onClick={() => removeColor(color)}
                                                    disabled={
                                                        colors.length === 1 ||
                                                        color.images.some((i) => i.uploading)
                                                    }
                                                >
                                                    <DeleteOutlinedIcon />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Box>
                                    <ColorImageUploader
                                        images={color.images}
                                        onFiles={(files) => handleFiles(color.id, files)}
                                        onRemove={(img) => removePhoto(color.id, img)}
                                        onMakeMain={(img) => makeMain(color.id, img)}
                                        onReorder={(fromKey, toKey) =>
                                            reorderPhotos(color.id, fromKey, toKey)
                                        }
                                    />
                                    {colorErrors[color.id] && (
                                        <Typography
                                            variant="caption"
                                            color="error"
                                            component="p"
                                            sx={{ mt: 0.5 }}
                                        >
                                            {colorErrors[color.id]}
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>

                        <Button
                            startIcon={<AddRoundedIcon />}
                            onClick={addColor}
                            sx={{ mt: 2, borderRadius: 99 }}
                        >
                            Add color
                        </Button>
                    </Section>

                    <Section
                        title="Sizes and stock"
                        subtitle="One row for each size and color combination you sell."
                    >
                        <Box sx={{ display: 'grid', gap: 1.5 }}>
                            {values.variants.map((variant, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'grid',
                                        gap: 1.5,
                                        alignItems: 'start',
                                        gridTemplateColumns: {
                                            xs: 'repeat(2, minmax(0, 1fr)) auto',
                                            sm:
                                                'minmax(0, 1fr) minmax(0, 1.3fr) ' +
                                                'minmax(0, 1fr) auto',
                                        },
                                    }}
                                >
                                    <TextField
                                        label="Size"
                                        name={`variants.${index}.size`}
                                        size="small"
                                        sx={fieldSx}
                                        value={variant.size}
                                        onChange={formik.handleChange}
                                        error={Boolean(variantError(index, 'size'))}
                                        helperText={variantError(index, 'size')}
                                    />
                                    <TextField
                                        select
                                        label="Color"
                                        name={`variants.${index}.colorId`}
                                        size="small"
                                        sx={fieldSx}
                                        value={
                                            colors.some((c) => c.id === variant.colorId)
                                                ? variant.colorId
                                                : ''
                                        }
                                        onChange={formik.handleChange}
                                        error={Boolean(variantError(index, 'colorId'))}
                                        helperText={variantError(index, 'colorId')}
                                    >
                                        {colors.map((c) => (
                                            <MenuItem key={c.id} value={c.id}>
                                                {colorLabel(c)}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        label="Stock"
                                        name={`variants.${index}.stock`}
                                        type="number"
                                        size="small"
                                        sx={fieldSx}
                                        value={variant.stock}
                                        onChange={formik.handleChange}
                                        error={Boolean(variantError(index, 'stock'))}
                                        helperText={variantError(index, 'stock')}
                                    />
                                    <Tooltip
                                        title={
                                            values.variants.length === 1
                                                ? 'Keep at least one size'
                                                : 'Remove'
                                        }
                                    >
                                        <span>
                                            <IconButton
                                                aria-label="Remove variant"
                                                onClick={() => removeVariant(index)}
                                                disabled={values.variants.length === 1}
                                            >
                                                <DeleteOutlinedIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Box>
                            ))}
                        </Box>
                        {typeof errors.variants === 'string' && (
                            <Typography
                                variant="caption"
                                color="error"
                                component="p"
                                sx={{ mt: 1 }}
                            >
                                {errors.variants}
                            </Typography>
                        )}
                        <Button
                            startIcon={<AddRoundedIcon />}
                            onClick={addVariant}
                            sx={{ mt: 2, borderRadius: 99 }}
                        >
                            Add size
                        </Button>
                    </Section>
                </Box>

                {/* ---------- Right: price, organization, summary ---------- */}
                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        minWidth: 0,
                        position: { lg: 'sticky' },
                        top: { lg: 24 },
                    }}
                >
                    <Section title="Pricing and organization">
                        <Box sx={{ display: 'grid', gap: 2 }}>
                            <TextField
                                label="Price"
                                name="price"
                                type="number"
                                sx={fieldSx}
                                value={values.price}
                                onChange={formik.handleChange}
                                error={Boolean(errors.price)}
                                helperText={errors.price}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">₱</InputAdornment>
                                        ),
                                    },
                                }}
                            />
                            <TextField
                                select
                                label="Category"
                                name="category"
                                sx={fieldSx}
                                value={values.category}
                                onChange={formik.handleChange}
                                error={Boolean(errors.category)}
                                helperText={errors.category}
                            >
                                {CATEGORIES.map((category) => (
                                    <MenuItem key={category} value={category}>
                                        {category}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Box>
                                <Typography
                                    variant="caption"
                                    sx={{ color: NEUTRAL, display: 'block', mb: 0.75 }}
                                >
                                    Gender
                                </Typography>
                                <ToggleButtonGroup
                                    exclusive
                                    fullWidth
                                    size="small"
                                    value={values.gender}
                                    onChange={(_, value) =>
                                        value && formik.setFieldValue('gender', value)
                                    }
                                    aria-label="Gender"
                                    sx={{
                                        gap: 1,
                                        '& .MuiToggleButtonGroup-grouped': {
                                            textTransform: 'none',
                                            margin: 0,
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '12px',
                                            '&:not(:first-of-type), &:not(:last-of-type)': {
                                                borderRadius: '12px',
                                            },
                                            '&.Mui-selected': { borderColor: 'var(--brand-dark)' },
                                        },
                                    }}
                                >
                                    {GENDERS.map((gender) => (
                                        <ToggleButton key={gender} value={gender}>
                                            {gender}
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                                {errors.gender && (
                                    <Typography
                                        variant="caption"
                                        color="error"
                                        component="p"
                                        sx={{ mt: 0.5 }}
                                    >
                                        {errors.gender}
                                    </Typography>
                                )}
                            </Box>

                            <TextField
                                label="Brand"
                                name="brand"
                                sx={fieldSx}
                                value={values.brand}
                                onChange={formik.handleChange}
                                error={Boolean(errors.brand)}
                                helperText={errors.brand}
                            />
                            <TextField
                                label="Material"
                                name="material"
                                sx={fieldSx}
                                value={values.material}
                                onChange={formik.handleChange}
                                error={Boolean(errors.material)}
                                helperText={errors.material}
                            />
                        </Box>
                    </Section>

                    <Section title="Summary">
                        <SummaryRow label="Colors" value={colors.length} />
                        <SummaryRow label="Size / color rows" value={values.variants.length} />
                        <SummaryRow label="Photos" value={totalPhotos} />
                        <SummaryRow label="Total stock" value={totalStock} />
                        <Divider sx={{ my: 2, borderColor: BORDER }} />
                        <Button
                            type="submit"
                            variant="contained"
                            disableElevation
                            fullWidth
                            disabled={loading || uploading}
                            sx={{ borderRadius: 99, height: 44 }}
                        >
                            {uploading
                                ? 'Uploading photos...'
                                : loading
                                  ? 'Saving...'
                                  : submitLabel}
                        </Button>
                        <Button
                            component={Link}
                            to="/admin/products"
                            color="inherit"
                            fullWidth
                            sx={{ mt: 1, borderRadius: 99, color: NEUTRAL }}
                        >
                            Cancel
                        </Button>
                    </Section>
                </Box>
            </Box>
        </form>
    );
}

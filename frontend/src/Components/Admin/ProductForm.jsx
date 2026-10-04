import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Alert, Button, Card, IconButton, MenuItem, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
    category: Yup.string().oneOf(CATEGORIES, 'Please select a category').required('Please select a category'),
    brand: Yup.string().trim().max(50, 'Brand is too long'),
    gender: Yup.string().oneOf(GENDERS, 'Please select a gender').required('Please select a gender'),
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
            })
        )
        .min(1, 'Add at least one size/color variant')
        .test('unique-variants', 'Each size and color combination can only appear once', (variants = []) => {
            const keys = variants.map((v) => `${(v.size || '').trim().toLowerCase()}|${v.colorId}`);
            return new Set(keys).size === keys.length;
        }),
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
                images: images.map((img) => ({ key: img.public_id, public_id: img.public_id, url: img.url })),
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
    // Photos live outside Formik because they upload in the background and update at different times
    const [colors, setColors] = useState(() => getInitialColors(product));
    const [colorErrors, setColorErrors] = useState({});
    // Always holds the latest colors, for code that runs later (uploads, submit)
    const colorsRef = useRef(colors);
    useEffect(() => {
        colorsRef.current = colors;
    }, [colors]);

    // Uploaded but not saved yet. If the admin leaves without saving, these are deleted from Cloudinary.
    // (The server refuses to delete a photo that belongs to a product, so this is safe after saving.)
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
        initialValues: getInitialValues(product, colors),
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
    const updateColor = (id, change) => setColors((prev) => prev.map((c) => (c.id === id ? { ...c, ...change(c) } : c)));

    const addColor = () => setColors((prev) => [...prev, { id: newId(), name: '', images: [] }]);

    const removeColor = (color) => {
        color.images.forEach((img) => img.public_id && pending.current.has(img.public_id) && discardUploadedImage(img.public_id));
        color.images.forEach((img) => pending.current.delete(img.public_id));
        setColors((prev) => prev.filter((c) => c.id !== color.id));
        // Sizes that used this color must pick another one
        formik.setFieldValue(
            'variants',
            values.variants.map((v) => (v.colorId === color.id ? { ...v, colorId: '' } : v))
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
            notifyError(`Only ${MAX_IMAGES_PER_COLOR} photos per color. Extra photos were skipped.`);
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
                updateColor(colorId, (c) => ({ images: c.images.map((i) => (i.key === tile.key ? { ...i, ...change } : i)) }));
            const dropTile = () => updateColor(colorId, (c) => ({ images: c.images.filter((i) => i.key !== tile.key) }));

            try {
                const dataUrl = await prepareImage(file);
                const saved = await uploadProductImage(dataUrl, (progress) => setTile({ progress }));

                if (!mounted.current) {
                    discardUploadedImage(saved.public_id);
                    continue;
                }
                pending.current.add(saved.public_id);
                setTile({ key: saved.public_id, public_id: saved.public_id, url: saved.url, uploading: false });
            } catch (err) {
                notifyError(err.response?.data?.message || err.message || `Could not upload ${file.name}`);
                if (mounted.current) dropTile();
            } finally {
                URL.revokeObjectURL(tile.url);
            }
        }
    };

    const removePhoto = (colorId, img) => {
        // A photo uploaded in this session can be deleted right away; saved ones are deleted when the product is saved
        if (pending.current.has(img.public_id)) {
            pending.current.delete(img.public_id);
            discardUploadedImage(img.public_id);
        }
        updateColor(colorId, (c) => ({ images: c.images.filter((i) => i.key !== img.key) }));
    };

    const makeMain = (colorId, img) =>
        updateColor(colorId, (c) => ({ images: [img, ...c.images.filter((i) => i.key !== img.key)] }));

    // ---- sizes ----
    const addVariant = () =>
        formik.setFieldValue('variants', [...values.variants, { size: '', colorId: colors[0]?.id || '', stock: 0 }]);

    const removeVariant = (index) =>
        formik.setFieldValue(
            'variants',
            values.variants.filter((_, i) => i !== index)
        );

    // ---- submit ----
    const checkColors = () => {
        const found = {};
        const names = new Set();

        colors.forEach((c) => {
            const key = c.name.trim().toLowerCase();
            if (!key) found[c.id] = 'Enter a color name';
            else if (names.has(key)) found[c.id] = 'This color is already added';
            else if (c.images.length === 0 && !hasLegacyPhotos) found[c.id] = 'Add at least one photo for this color';
            else if (!values.variants.some((v) => v.colorId === c.id)) found[c.id] = 'Add a size for this color below';
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

    return (
        <Card className="form-card">
            <form onSubmit={handleSubmit} noValidate>
                <Typography variant="h6" className="form-section-title">
                    Product details
                </Typography>
                <div className="form-grid">
                    <TextField
                        label="Product name"
                        name="name"
                        className="form-grid-full"
                        value={values.name}
                        onChange={formik.handleChange}
                        error={Boolean(errors.name)}
                        helperText={errors.name}
                    />
                    <TextField
                        label="Description"
                        name="description"
                        multiline
                        minRows={3}
                        className="form-grid-full"
                        value={values.description}
                        onChange={formik.handleChange}
                        error={Boolean(errors.description)}
                        helperText={errors.description}
                    />
                    <TextField
                        label="Price (₱)"
                        name="price"
                        type="number"
                        value={values.price}
                        onChange={formik.handleChange}
                        error={Boolean(errors.price)}
                        helperText={errors.price}
                    />
                    <TextField
                        select
                        label="Category"
                        name="category"
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
                    <TextField
                        label="Brand"
                        name="brand"
                        value={values.brand}
                        onChange={formik.handleChange}
                        error={Boolean(errors.brand)}
                        helperText={errors.brand}
                    />
                    <TextField
                        select
                        label="Gender"
                        name="gender"
                        value={values.gender}
                        onChange={formik.handleChange}
                        error={Boolean(errors.gender)}
                        helperText={errors.gender}
                    >
                        {GENDERS.map((gender) => (
                            <MenuItem key={gender} value={gender}>
                                {gender}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        label="Material"
                        name="material"
                        className="form-grid-full"
                        value={values.material}
                        onChange={formik.handleChange}
                        error={Boolean(errors.material)}
                        helperText={errors.material}
                    />
                </div>

                <Typography variant="h6" className="form-section-title">
                    Colors and photos
                </Typography>
                <Typography variant="body2" color="text.secondary" className="form-hint">
                    Each color gets its own photos. Shoppers see them when they pick that color.
                </Typography>
                {hasLegacyPhotos && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        This product still uses its old shared photos. Colors without their own photos keep showing those.
                    </Alert>
                )}

                {colors.map((color) => (
                    <div className="color-card" key={color.id}>
                        <div className="color-card-header">
                            <TextField
                                label="Color name"
                                size="small"
                                placeholder="e.g. Navy blue"
                                value={color.name}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    updateColor(color.id, () => ({ name }));
                                    setColorErrors((prev) => ({ ...prev, [color.id]: undefined }));
                                }}
                                error={Boolean(colorErrors[color.id]) && !color.name.trim()}
                            />
                            <IconButton
                                aria-label={`Remove ${colorLabel(color)}`}
                                onClick={() => removeColor(color)}
                                disabled={colors.length === 1 || color.images.some((i) => i.uploading)}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </div>
                        <ColorImageUploader
                            images={color.images}
                            onFiles={(files) => handleFiles(color.id, files)}
                            onRemove={(img) => removePhoto(color.id, img)}
                            onMakeMain={(img) => makeMain(color.id, img)}
                        />
                        {colorErrors[color.id] && <p className="field-error">{colorErrors[color.id]}</p>}
                    </div>
                ))}
                <Button variant="outlined" size="small" onClick={addColor}>
                    Add color
                </Button>

                <Typography variant="h6" className="form-section-title">
                    Sizes and stock
                </Typography>
                {values.variants.map((variant, index) => (
                    <div className="variant-row" key={index}>
                        <TextField
                            label="Size"
                            name={`variants.${index}.size`}
                            className="variant-field"
                            size="small"
                            value={variant.size}
                            onChange={formik.handleChange}
                            error={Boolean(variantError(index, 'size'))}
                            helperText={variantError(index, 'size')}
                        />
                        <TextField
                            select
                            label="Color"
                            name={`variants.${index}.colorId`}
                            className="variant-field"
                            size="small"
                            value={colors.some((c) => c.id === variant.colorId) ? variant.colorId : ''}
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
                            className="variant-field"
                            size="small"
                            value={variant.stock}
                            onChange={formik.handleChange}
                            error={Boolean(variantError(index, 'stock'))}
                            helperText={variantError(index, 'stock')}
                        />
                        <IconButton
                            aria-label="Remove variant"
                            onClick={() => removeVariant(index)}
                            disabled={values.variants.length === 1}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </div>
                ))}
                {typeof errors.variants === 'string' && <p className="field-error">{errors.variants}</p>}
                <Button variant="outlined" size="small" onClick={addVariant}>
                    Add size
                </Button>

                <div className="form-actions">
                    <Button component={Link} to="/admin/products">
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={loading || uploading}>
                        {uploading ? 'Uploading photos...' : loading ? 'Saving...' : submitLabel}
                    </Button>
                </div>
            </form>
        </Card>
    );
}

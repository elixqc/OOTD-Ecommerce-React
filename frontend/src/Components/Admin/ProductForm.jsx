import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, Card, IconButton, MenuItem, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { CATEGORIES, GENDERS, MAX_FILE_SIZE, MAX_IMAGES } from '../../constants/productConstants';
import { notifyError } from '../../Utils/helpers';

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
                color: Yup.string().trim().required('Color is required'),
                stock: Yup.number()
                    .typeError('Stock must be a number')
                    .integer('Whole numbers only')
                    .min(0, 'Cannot be negative')
                    .required('Stock is required'),
            })
        )
        .min(1, 'Add at least one size/color variant')
        .test('unique-variants', 'Each size and color combination can only appear once', (variants = []) => {
            const keys = variants.map((v) => `${(v.size || '').trim().toLowerCase()}|${(v.color || '').trim().toLowerCase()}`);
            return new Set(keys).size === keys.length;
        }),
    newImages: Yup.array().test('image-count', `Add between 1 and ${MAX_IMAGES} images`, function (newImages = []) {
        const total = (this.parent.existingImages?.length || 0) + newImages.length;
        return total >= 1 && total <= MAX_IMAGES;
    }),
});

const getInitialValues = (product) => ({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price ?? '',
    category: product?.category || '',
    brand: product?.brand || '',
    gender: product?.gender || 'Unisex',
    material: product?.material || '',
    variants: product?.variants?.length
        ? product.variants.map((v) => ({ size: v.size, color: v.color, stock: v.stock }))
        : [{ size: '', color: '', stock: 0 }],
    existingImages: product?.images?.map((img) => ({ public_id: img.public_id, url: img.url })) || [],
    newImages: [],
});

const readFile = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read the image'));
        reader.readAsDataURL(file);
    });

// Used by both NewProduct and UpdateProduct.
// Pass `product` to edit; omit it to create.
export default function ProductForm({ product, onSubmit, submitLabel, loading }) {
    const fileInput = useRef(null);
    const isEdit = Boolean(product);

    const formik = useFormik({
        initialValues: getInitialValues(product),
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: (values) => {
            const payload = {
                name: values.name.trim(),
                description: values.description.trim(),
                price: Number(values.price),
                category: values.category,
                brand: values.brand.trim(),
                gender: values.gender,
                material: values.material.trim(),
                variants: values.variants.map((v) => ({
                    size: v.size.trim(),
                    color: v.color.trim(),
                    stock: Number(v.stock),
                })),
                newImages: values.newImages,
            };
            if (isEdit) {
                payload.keepImageIds = values.existingImages.map((img) => img.public_id);
            }
            return onSubmit(payload);
        },
    });

    const { values, errors } = formik;
    const totalImages = values.existingImages.length + values.newImages.length;

    const variantError = (index, field) =>
        Array.isArray(errors.variants) ? errors.variants[index]?.[field] : undefined;

    const addVariant = () => formik.setFieldValue('variants', [...values.variants, { size: '', color: '', stock: 0 }]);

    const removeVariant = (index) =>
        formik.setFieldValue(
            'variants',
            values.variants.filter((_, i) => i !== index)
        );

    const handleFiles = async (event) => {
        const files = Array.from(event.target.files);
        event.target.value = '';

        const room = MAX_IMAGES - totalImages;
        const valid = [];
        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                notifyError(`${file.name} is not an image`);
            } else if (file.size > MAX_FILE_SIZE) {
                notifyError(`${file.name} is larger than 2 MB`);
            } else {
                valid.push(file);
            }
        }
        if (valid.length > room) {
            notifyError(`You can add up to ${MAX_IMAGES} images`);
        }

        try {
            const dataUrls = await Promise.all(valid.slice(0, Math.max(room, 0)).map(readFile));
            formik.setFieldValue('newImages', [...values.newImages, ...dataUrls]);
        } catch (err) {
            notifyError(err.message);
        }
    };

    const removeExistingImage = (publicId) =>
        formik.setFieldValue(
            'existingImages',
            values.existingImages.filter((img) => img.public_id !== publicId)
        );

    const removeNewImage = (index) =>
        formik.setFieldValue(
            'newImages',
            values.newImages.filter((_, i) => i !== index)
        );

    return (
        <Card className="form-card">
            <form onSubmit={formik.handleSubmit} noValidate>
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
                    Sizes, colors, and stock
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
                            label="Color"
                            name={`variants.${index}.color`}
                            className="variant-field"
                            size="small"
                            value={variant.color}
                            onChange={formik.handleChange}
                            error={Boolean(variantError(index, 'color'))}
                            helperText={variantError(index, 'color')}
                        />
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
                    Add size/color
                </Button>

                <Typography variant="h6" className="form-section-title">
                    Images ({totalImages}/{MAX_IMAGES})
                </Typography>
                <div className="image-grid">
                    {values.existingImages.map((img) => (
                        <div className="image-thumb" key={img.public_id}>
                            <img src={img.url} alt="Product" />
                            <IconButton
                                size="small"
                                className="image-remove"
                                aria-label="Remove image"
                                onClick={() => removeExistingImage(img.public_id)}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </div>
                    ))}
                    {values.newImages.map((src, index) => (
                        <div className="image-thumb" key={index}>
                            <img src={src} alt="New upload" />
                            <IconButton
                                size="small"
                                className="image-remove"
                                aria-label="Remove image"
                                onClick={() => removeNewImage(index)}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </div>
                    ))}
                </div>
                <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleFiles}
                />
                <Button variant="outlined" size="small" onClick={() => fileInput.current.click()} disabled={totalImages >= MAX_IMAGES}>
                    Add images
                </Button>
                {typeof errors.newImages === 'string' && <p className="field-error">{errors.newImages}</p>}

                <div className="form-actions">
                    <Button component={Link} to="/admin/products">
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? 'Saving...' : submitLabel}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
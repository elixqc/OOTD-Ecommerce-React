// MP1 · Product CRUD — edit-product page.
// Loads the product then renders ProductForm; dispatches updateProduct on submit.
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Chip, IconButton, Skeleton, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { getProductDetails, updateProduct } from '../../actions/productActions';
import { clearErrors } from '../../actions/userActions';
import { UPDATE_PRODUCT_RESET } from '../../constants/productConstants';
import { notifyError, notifySuccess } from '../../Utils/helpers';
import ProductForm from './ProductForm';

export default function UpdateProduct() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {
        loading: loadingDetails,
        product,
        error: detailsError,
    } = useSelector((state) => state.productDetails);
    const {
        loading: updating,
        isUpdated,
        error: updateError,
    } = useSelector((state) => state.product);

    useEffect(() => {
        dispatch(getProductDetails(id, false, true));
    }, [dispatch, id]);

    useEffect(() => {
        if (detailsError) {
            notifyError(detailsError);
            dispatch(clearErrors());
            navigate('/admin/products');
        }
        if (updateError) {
            notifyError(updateError);
            dispatch(clearErrors());
        }
        if (isUpdated) {
            notifySuccess('Product updated');
            dispatch({ type: UPDATE_PRODUCT_RESET });
            navigate('/admin/products');
        }
    }, [detailsError, updateError, isUpdated, dispatch, navigate]);

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                <IconButton
                    component={Link}
                    to="/admin/products"
                    aria-label="Back to products"
                    sx={{ border: '1px solid #eceef2', borderRadius: '12px' }}
                >
                    <ArrowBackRoundedIcon />
                </IconButton>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                        Edit product
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {product ? product.name : 'Loading…'}
                    </Typography>
                </Box>
                {product && (
                    <>
                        <Chip
                            size="small"
                            variant="outlined"
                            label={product.isActive === false ? 'Hidden' : 'Active'}
                            color={product.isActive === false ? 'default' : 'success'}
                        />
                        <Button
                            component={Link}
                            to={`/product/${id}`}
                            target="_blank"
                            rel="noreferrer"
                            size="small"
                            color="inherit"
                            endIcon={<OpenInNewRoundedIcon fontSize="small" />}
                            sx={{ borderRadius: 99, color: '#8a8f98' }}
                        >
                            View in shop
                        </Button>
                    </>
                )}
            </Box>
            {loadingDetails || !product ? (
                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' },
                    }}
                >
                    <Skeleton variant="rounded" height={420} sx={{ borderRadius: '16px' }} />
                    <Skeleton variant="rounded" height={420} sx={{ borderRadius: '16px' }} />
                </Box>
            ) : (
                <ProductForm
                    product={product}
                    onSubmit={(payload) => dispatch(updateProduct(id, payload))}
                    submitLabel="Save changes"
                    loading={updating}
                />
            )}
        </>
    );
}

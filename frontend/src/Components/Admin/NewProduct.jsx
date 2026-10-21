// MP1 · Product CRUD — create-product page.
// Thin shell that renders ProductForm and dispatches newProduct on submit.
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { newProduct } from '../../actions/productActions';
import { clearErrors } from '../../actions/userActions';
import { NEW_PRODUCT_RESET } from '../../constants/productConstants';
import { notifyError, notifySuccess } from '../../Utils/helpers';
import ProductForm from './ProductForm';

export default function NewProduct() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, success } = useSelector((state) => state.newProduct);

    useEffect(() => {
        if (error) {
            notifyError(error);
            dispatch(clearErrors());
        }
        if (success) {
            notifySuccess('Product created');
            dispatch({ type: NEW_PRODUCT_RESET });
            navigate('/admin/products');
        }
    }, [error, success, dispatch, navigate]);

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <IconButton
                    component={Link}
                    to="/admin/products"
                    aria-label="Back to products"
                    sx={{ border: '1px solid #eceef2', borderRadius: '12px' }}
                >
                    <ArrowBackRoundedIcon />
                </IconButton>
                <Box>
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                        New product
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Add a product to your shop
                    </Typography>
                </Box>
            </Box>
            <ProductForm
                onSubmit={(payload) => dispatch(newProduct(payload))}
                submitLabel="Create product"
                loading={loading}
            />
        </>
    );
}

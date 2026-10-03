import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Typography } from '@mui/material';
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
            <Typography variant="h4" component="h1" className="page-title">
                New product
            </Typography>
            <ProductForm
                onSubmit={(payload) => dispatch(newProduct(payload))}
                submitLabel="Create product"
                loading={loading}
            />
        </>
    );
}
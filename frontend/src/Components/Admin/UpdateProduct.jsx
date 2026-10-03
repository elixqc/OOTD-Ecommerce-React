import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CircularProgress, Typography } from '@mui/material';
import { getProductDetails, updateProduct } from '../../actions/productActions';
import { clearErrors } from '../../actions/userActions';
import { UPDATE_PRODUCT_RESET } from '../../constants/productConstants';
import { notifyError, notifySuccess } from '../../Utils/helpers';
import ProductForm from './ProductForm';

export default function UpdateProduct() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading: loadingDetails, product, error: detailsError } = useSelector((state) => state.productDetails);
    const { loading: updating, isUpdated, error: updateError } = useSelector((state) => state.product);

    useEffect(() => {
        dispatch(getProductDetails(id));
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
            <Typography variant="h4" component="h1" className="page-title">
                Edit product
            </Typography>
            {loadingDetails || !product ? (
                <CircularProgress />
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
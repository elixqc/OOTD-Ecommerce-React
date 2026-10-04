import api from '../api';
import { getErrorMessage } from '../Utils/helpers';
import {
    ADMIN_PRODUCTS_REQUEST,
    ADMIN_PRODUCTS_SUCCESS,
    ADMIN_PRODUCTS_FAIL,
    PRODUCT_DETAILS_REQUEST,
    PRODUCT_DETAILS_SUCCESS,
    PRODUCT_DETAILS_FAIL,
    NEW_PRODUCT_REQUEST,
    NEW_PRODUCT_SUCCESS,
    NEW_PRODUCT_FAIL,
    UPDATE_PRODUCT_REQUEST,
    UPDATE_PRODUCT_SUCCESS,
    UPDATE_PRODUCT_FAIL,
    DELETE_PRODUCT_REQUEST,
    DELETE_PRODUCT_SUCCESS,
    DELETE_PRODUCT_FAIL,
    PRODUCTS_REQUEST,
    PRODUCTS_SUCCESS,
    PRODUCTS_FAIL,
    RELATED_PRODUCTS_REQUEST,
    RELATED_PRODUCTS_SUCCESS,
    RELATED_PRODUCTS_FAIL,
} from '../constants/productConstants';

export const getAdminProducts = () => async (dispatch) => {
    try {
        dispatch({ type: ADMIN_PRODUCTS_REQUEST });
        const { data } = await api.get('/admin/products');
        dispatch({ type: ADMIN_PRODUCTS_SUCCESS, payload: data.products });
    } catch (error) {
        dispatch({ type: ADMIN_PRODUCTS_FAIL, payload: getErrorMessage(error) });
    }
};

// silent = refresh the data without showing the loading spinner (e.g. after a new review)
export const getProductDetails = (id, silent = false) => async (dispatch) => {
    try {
        if (!silent) dispatch({ type: PRODUCT_DETAILS_REQUEST });
        const { data } = await api.get(`/product/${id}`);
        dispatch({ type: PRODUCT_DETAILS_SUCCESS, payload: data.product });
    } catch (error) {
        dispatch({ type: PRODUCT_DETAILS_FAIL, payload: getErrorMessage(error) });
    }
};

export const newProduct = (productData) => async (dispatch) => {
    try {
        dispatch({ type: NEW_PRODUCT_REQUEST });
        const { data } = await api.post('/admin/product/new', productData);
        dispatch({ type: NEW_PRODUCT_SUCCESS, payload: data.product });
    } catch (error) {
        dispatch({ type: NEW_PRODUCT_FAIL, payload: getErrorMessage(error) });
    }
};

export const updateProduct = (id, productData) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_PRODUCT_REQUEST });
        await api.put(`/admin/product/${id}`, productData);
        dispatch({ type: UPDATE_PRODUCT_SUCCESS });
    } catch (error) {
        dispatch({ type: UPDATE_PRODUCT_FAIL, payload: getErrorMessage(error) });
    }
};

export const deleteProduct = (id) => async (dispatch) => {
    try {
        dispatch({ type: DELETE_PRODUCT_REQUEST });
        await api.delete(`/admin/product/${id}`);
        dispatch({ type: DELETE_PRODUCT_SUCCESS, payload: 1 });
    } catch (error) {
        dispatch({ type: DELETE_PRODUCT_FAIL, payload: getErrorMessage(error) });
    }
};

// Bulk delete from the checkboxes
export const deleteProducts = (ids) => async (dispatch) => {
    try {
        dispatch({ type: DELETE_PRODUCT_REQUEST });
        const { data } = await api.delete('/admin/products', { data: { ids } });
        dispatch({ type: DELETE_PRODUCT_SUCCESS, payload: data.deletedCount });
    } catch (error) {
        dispatch({ type: DELETE_PRODUCT_FAIL, payload: getErrorMessage(error) });
    }
};

let latestRequest = 0;

// Page 1 starts a fresh list (new filters). Later pages are appended.
export const getProducts = (filters, page) => async (dispatch) => {
    // If filters change while a request is running, the older response is ignored
    const requestId = ++latestRequest;

    const params = { page, limit: 8 };
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== 'All') params[key] = value;
    });

    try {
        dispatch({ type: PRODUCTS_REQUEST, payload: page });
        const { data } = await api.get('/products', { params });
        if (requestId !== latestRequest) return;
        dispatch({
            type: PRODUCTS_SUCCESS,
            payload: { products: data.products, page: data.page, hasMore: data.hasMore, total: data.total },
        });
    } catch (error) {
        if (requestId !== latestRequest) return;
        dispatch({ type: PRODUCTS_FAIL, payload: getErrorMessage(error) });
    }
};

// Called when the bottom of the list scrolls into view. Reads the latest state, so it can't double-load.
export const loadMoreProducts = (filters) => (dispatch, getState) => {
    const { loading, hasMore, page } = getState().catalog;
    if (loading || !hasMore || page === 0) return;
    return dispatch(getProducts(filters, page + 1));
};

let latestRelatedRequest = 0;

export const getRelatedProducts = (id) => async (dispatch) => {
    // Ignore an older response if the shopper already moved to another product
    const requestId = ++latestRelatedRequest;

    try {
        dispatch({ type: RELATED_PRODUCTS_REQUEST });
        const { data } = await api.get(`/product/${id}/related`);
        if (requestId !== latestRelatedRequest) return;
        dispatch({ type: RELATED_PRODUCTS_SUCCESS, payload: data.products });
    } catch (error) {
        if (requestId !== latestRelatedRequest) return;
        dispatch({ type: RELATED_PRODUCTS_FAIL, payload: getErrorMessage(error) });
    }
};

// Uploads one image right away (used by the product form). Not stored in Redux.
// onProgress receives 0-100.
export const uploadProductImage = async (image, onProgress) => {
    const { data } = await api.post(
        '/admin/product/image',
        { image },
        { onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)) }
    );
    return data.image;
};

// Removes an upload that was never saved to a product. The server ignores images that are in use.
export const discardUploadedImage = (publicId) =>
    api.delete('/admin/product/image', { data: { public_id: publicId } }).catch(() => {});

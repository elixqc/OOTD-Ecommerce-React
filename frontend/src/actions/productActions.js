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

export const getProductDetails = (id) => async (dispatch) => {
    try {
        dispatch({ type: PRODUCT_DETAILS_REQUEST });
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
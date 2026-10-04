import api from '../api';
import { getErrorMessage } from '../Utils/helpers';
import {
    NEW_ORDER_REQUEST,
    NEW_ORDER_SUCCESS,
    NEW_ORDER_FAIL,
    MY_ORDERS_REQUEST,
    MY_ORDERS_SUCCESS,
    MY_ORDERS_FAIL,
    ORDER_DETAILS_REQUEST,
    ORDER_DETAILS_SUCCESS,
    ORDER_DETAILS_FAIL,
    ADMIN_ORDERS_REQUEST,
    ADMIN_ORDERS_SUCCESS,
    ADMIN_ORDERS_FAIL,
    UPDATE_ORDER_REQUEST,
    UPDATE_ORDER_SUCCESS,
    UPDATE_ORDER_FAIL,
    DELETE_ORDER_REQUEST,
    DELETE_ORDER_SUCCESS,
    DELETE_ORDER_FAIL,
} from '../constants/orderConstants';

// Returns the new order, or null if it failed (the error is saved in state.newOrder.error)
export const createOrder = (orderData) => async (dispatch) => {
    try {
        dispatch({ type: NEW_ORDER_REQUEST });
        const { data } = await api.post('/order/new', orderData);
        dispatch({ type: NEW_ORDER_SUCCESS, payload: data.order });
        return data.order;
    } catch (error) {
        dispatch({ type: NEW_ORDER_FAIL, payload: getErrorMessage(error) });
        return null;
    }
};

export const getMyOrders = () => async (dispatch) => {
    try {
        dispatch({ type: MY_ORDERS_REQUEST });
        const { data } = await api.get('/orders/me');
        dispatch({ type: MY_ORDERS_SUCCESS, payload: data.orders });
    } catch (error) {
        dispatch({ type: MY_ORDERS_FAIL, payload: getErrorMessage(error) });
    }
};

export const getOrderDetails = (id) => async (dispatch) => {
    try {
        dispatch({ type: ORDER_DETAILS_REQUEST });
        const { data } = await api.get(`/order/${id}`);
        dispatch({ type: ORDER_DETAILS_SUCCESS, payload: data.order });
    } catch (error) {
        dispatch({ type: ORDER_DETAILS_FAIL, payload: getErrorMessage(error) });
    }
};

export const getAdminOrders = () => async (dispatch) => {
    try {
        dispatch({ type: ADMIN_ORDERS_REQUEST });
        const { data } = await api.get('/admin/orders');
        dispatch({ type: ADMIN_ORDERS_SUCCESS, payload: { orders: data.orders, totalAmount: data.totalAmount } });
    } catch (error) {
        dispatch({ type: ADMIN_ORDERS_FAIL, payload: getErrorMessage(error) });
    }
};

export const updateOrder = (id, status) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_ORDER_REQUEST });
        await api.put(`/admin/order/${id}`, { status });
        dispatch({ type: UPDATE_ORDER_SUCCESS });
    } catch (error) {
        dispatch({ type: UPDATE_ORDER_FAIL, payload: getErrorMessage(error) });
    }
};

export const deleteOrder = (id) => async (dispatch) => {
    try {
        dispatch({ type: DELETE_ORDER_REQUEST });
        await api.delete(`/admin/order/${id}`);
        dispatch({ type: DELETE_ORDER_SUCCESS });
    } catch (error) {
        dispatch({ type: DELETE_ORDER_FAIL, payload: getErrorMessage(error) });
    }
};

// Downloads the order's PDF receipt. Returns an error message, or null when it worked.
export const downloadReceipt = (id) => async () => {
    try {
        const { data } = await api.get(`/order/${id}/receipt`, { responseType: 'blob' });
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `OOTD-receipt-${String(id).slice(-6).toUpperCase()}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        return null;
    } catch {
        return 'Could not download the receipt';
    }
};

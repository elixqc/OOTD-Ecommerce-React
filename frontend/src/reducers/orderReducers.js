import {
    NEW_ORDER_REQUEST,
    NEW_ORDER_SUCCESS,
    NEW_ORDER_FAIL,
    NEW_ORDER_RESET,
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
    UPDATE_ORDER_RESET,
    DELETE_ORDER_REQUEST,
    DELETE_ORDER_SUCCESS,
    DELETE_ORDER_FAIL,
    DELETE_ORDER_RESET,
} from '../constants/orderConstants';
import { CLEAR_ERRORS } from '../constants/userConstants';

export const newOrderReducer = (state = { order: null }, action) => {
    switch (action.type) {
        case NEW_ORDER_REQUEST:
            return { ...state, loading: true };
        case NEW_ORDER_SUCCESS:
            return { loading: false, order: action.payload };
        case NEW_ORDER_FAIL:
            return { ...state, loading: false, error: action.payload };
        case NEW_ORDER_RESET:
            return { order: null };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const myOrdersReducer = (state = { orders: [] }, action) => {
    switch (action.type) {
        case MY_ORDERS_REQUEST:
            return { ...state, loading: true };
        case MY_ORDERS_SUCCESS:
            return { loading: false, orders: action.payload };
        case MY_ORDERS_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const orderDetailsReducer = (state = { order: null }, action) => {
    switch (action.type) {
        case ORDER_DETAILS_REQUEST:
            return { loading: true, order: null };
        case ORDER_DETAILS_SUCCESS:
            return { loading: false, order: action.payload };
        case ORDER_DETAILS_FAIL:
            return { loading: false, order: null, error: action.payload };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const adminOrdersReducer = (state = { orders: [], totalAmount: 0 }, action) => {
    switch (action.type) {
        case ADMIN_ORDERS_REQUEST:
            return { ...state, loading: true };
        case ADMIN_ORDERS_SUCCESS:
            return { loading: false, orders: action.payload.orders, totalAmount: action.payload.totalAmount };
        case ADMIN_ORDERS_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

// Admin: updating or deleting an order
export const orderReducer = (state = {}, action) => {
    switch (action.type) {
        case UPDATE_ORDER_REQUEST:
        case DELETE_ORDER_REQUEST:
            return { ...state, loading: true };
        case UPDATE_ORDER_SUCCESS:
            return { ...state, loading: false, isUpdated: true };
        case DELETE_ORDER_SUCCESS:
            return { ...state, loading: false, isDeleted: true };
        case UPDATE_ORDER_FAIL:
        case DELETE_ORDER_FAIL:
            return { ...state, loading: false, error: action.payload };
        case UPDATE_ORDER_RESET:
            return { ...state, isUpdated: false };
        case DELETE_ORDER_RESET:
            return { ...state, isDeleted: false };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

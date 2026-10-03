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
    NEW_PRODUCT_RESET,
    UPDATE_PRODUCT_REQUEST,
    UPDATE_PRODUCT_SUCCESS,
    UPDATE_PRODUCT_FAIL,
    UPDATE_PRODUCT_RESET,
    DELETE_PRODUCT_REQUEST,
    DELETE_PRODUCT_SUCCESS,
    DELETE_PRODUCT_FAIL,
    DELETE_PRODUCT_RESET,
    PRODUCTS_REQUEST,
    PRODUCTS_SUCCESS,
    PRODUCTS_FAIL,
} from '../constants/productConstants';
import { CLEAR_ERRORS } from '../constants/userConstants';

export const adminProductsReducer = (state = { products: [] }, action) => {
    switch (action.type) {
        case ADMIN_PRODUCTS_REQUEST:
            return { ...state, loading: true };
        case ADMIN_PRODUCTS_SUCCESS:
            return { loading: false, products: action.payload };
        case ADMIN_PRODUCTS_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const productDetailsReducer = (state = { product: null }, action) => {
    switch (action.type) {
        case PRODUCT_DETAILS_REQUEST:
            return { loading: true, product: null };
        case PRODUCT_DETAILS_SUCCESS:
            return { loading: false, product: action.payload };
        case PRODUCT_DETAILS_FAIL:
            return { loading: false, product: null, error: action.payload };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const newProductReducer = (state = { product: null }, action) => {
    switch (action.type) {
        case NEW_PRODUCT_REQUEST:
            return { ...state, loading: true };
        case NEW_PRODUCT_SUCCESS:
            return { loading: false, success: true, product: action.payload };
        case NEW_PRODUCT_FAIL:
            return { ...state, loading: false, error: action.payload };
        case NEW_PRODUCT_RESET:
            return { ...state, success: false };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

// Update and delete (single or bulk)
export const productReducer = (state = {}, action) => {
    switch (action.type) {
        case UPDATE_PRODUCT_REQUEST:
        case DELETE_PRODUCT_REQUEST:
            return { ...state, loading: true };
        case UPDATE_PRODUCT_SUCCESS:
            return { ...state, loading: false, isUpdated: true };
        case DELETE_PRODUCT_SUCCESS:
            return { ...state, loading: false, isDeleted: true, deletedCount: action.payload };
        case UPDATE_PRODUCT_FAIL:
        case DELETE_PRODUCT_FAIL:
            return { ...state, loading: false, error: action.payload };
        case UPDATE_PRODUCT_RESET:
            return { ...state, isUpdated: false };
        case DELETE_PRODUCT_RESET:
            return { ...state, isDeleted: false, deletedCount: 0 };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

// Public catalog with infinite scroll: pages are appended to the list
export const catalogReducer = (
    state = { products: [], loading: false, page: 0, hasMore: true, total: 0, error: null },
    action
) => {
    switch (action.type) {
        case PRODUCTS_REQUEST:
            // Page 1 means new filters, so start the list over
            return action.payload === 1
                ? { products: [], loading: true, page: 0, hasMore: true, total: 0, error: null }
                : { ...state, loading: true, error: null };

        case PRODUCTS_SUCCESS:
            return {
                loading: false,
                error: null,
                products:
                    action.payload.page === 1
                        ? action.payload.products
                        : [...state.products, ...action.payload.products],
                page: action.payload.page,
                hasMore: action.payload.hasMore,
                total: action.payload.total,
            };

        case PRODUCTS_FAIL:
            // hasMore false stops the scroll from retrying in a loop
            return { ...state, loading: false, hasMore: false, error: action.payload };

        default:
            return state;
    }
};
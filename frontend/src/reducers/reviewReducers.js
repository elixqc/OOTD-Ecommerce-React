import {
    PRODUCT_REVIEWS_REQUEST,
    PRODUCT_REVIEWS_SUCCESS,
    PRODUCT_REVIEWS_FAIL,
    REVIEW_STATUS_REQUEST,
    REVIEW_STATUS_SUCCESS,
    REVIEW_STATUS_FAIL,
    ADMIN_REVIEWS_REQUEST,
    ADMIN_REVIEWS_SUCCESS,
    ADMIN_REVIEWS_FAIL,
    MY_REVIEWS_REQUEST,
    MY_REVIEWS_SUCCESS,
    MY_REVIEWS_FAIL,
} from '../constants/reviewConstants';
import { CLEAR_ERRORS } from '../constants/userConstants';

// productId says which product the list belongs to, because the store can
// still hold the previous product's reviews while a new page loads
export const productReviewsReducer = (state = { reviews: [], productId: null }, action) => {
    switch (action.type) {
        case PRODUCT_REVIEWS_REQUEST:
            return { ...state, loading: true };
        case PRODUCT_REVIEWS_SUCCESS:
            return { loading: false, productId: action.payload.productId, reviews: action.payload.reviews };
        case PRODUCT_REVIEWS_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const reviewStatusReducer = (state = { productId: null, canReview: false, review: null }, action) => {
    switch (action.type) {
        case REVIEW_STATUS_REQUEST:
            return { productId: null, canReview: false, review: null, loading: true };
        case REVIEW_STATUS_SUCCESS:
            return { loading: false, ...action.payload };
        case REVIEW_STATUS_FAIL:
            // Not logged in or not allowed: just don't show the form
            return { productId: null, canReview: false, review: null, loading: false };
        default:
            return state;
    }
};

export const adminReviewsReducer = (state = { reviews: [] }, action) => {
    switch (action.type) {
        case ADMIN_REVIEWS_REQUEST:
            return { ...state, loading: true };
        case ADMIN_REVIEWS_SUCCESS:
            return { loading: false, reviews: action.payload };
        case ADMIN_REVIEWS_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const myReviewsReducer = (state = { reviews: [] }, action) => {
    switch (action.type) {
        case MY_REVIEWS_REQUEST:
            return { ...state, loading: true };
        case MY_REVIEWS_SUCCESS:
            return { loading: false, reviews: action.payload };
        case MY_REVIEWS_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

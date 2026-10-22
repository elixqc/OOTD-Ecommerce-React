// MP3 · Review ratings — review state.
// Tracks product reviews, review status, admin list and my-reviews from reviewActions.
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
    MY_REVIEW_LIST_REQUEST,
    MY_REVIEW_LIST_SUCCESS,
    MY_REVIEW_LIST_FAIL,
    NEW_REVIEW_REQUEST,
    NEW_REVIEW_SUCCESS,
    NEW_REVIEW_FAIL,
    NEW_REVIEW_RESET,
    UPDATE_REVIEW_REQUEST,
    UPDATE_REVIEW_SUCCESS,
    UPDATE_REVIEW_FAIL,
    UPDATE_REVIEW_RESET,
    DELETE_REVIEW_REQUEST,
    DELETE_REVIEW_SUCCESS,
    DELETE_REVIEW_FAIL,
    DELETE_REVIEW_RESET,
} from '../constants/reviewConstants';
import { CLEAR_ERRORS, LOGOUT_SUCCESS } from '../constants/userConstants';

// productId says which product the list belongs to, because the store can
// still hold the previous product's reviews while a new page loads

const noVariants = { sizes: [], colors: [] };

export const productReviewsReducer = (
    state = { reviews: [], productId: null, summary: null, variantOptions: noVariants },
    action,
) => {
    switch (action.type) {
        case PRODUCT_REVIEWS_REQUEST:
            return { ...state, loading: true };
        case PRODUCT_REVIEWS_SUCCESS:
            return {
                loading: false,
                productId: action.payload.productId,
                reviews: action.payload.reviews,
                summary: action.payload.summary,
                variantOptions: action.payload.variantOptions || noVariants,
            };
        case PRODUCT_REVIEWS_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const reviewStatusReducer = (
    state = { productId: null, canReview: false, review: null },
    action,
) => {
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

// The "My reviews" page: full reviews with their product. Kept apart from myReviews above,
// where product is just an id that the order page compares against.
export const myReviewListReducer = (
    state = { reviews: [], loading: false, loaded: false },
    action,
) => {
    switch (action.type) {
        case MY_REVIEW_LIST_REQUEST:
            return { ...state, loading: true };
        case MY_REVIEW_LIST_SUCCESS:
            return { loading: false, loaded: true, reviews: action.payload };
        case MY_REVIEW_LIST_FAIL:
            return { ...state, loading: false, error: action.payload };
        // Never carry one person's reviews over to the next person on this browser
        case LOGOUT_SUCCESS:
            return { reviews: [], loading: false, loaded: false };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

// Writing a new review
export const newReviewReducer = (state = {}, action) => {
    switch (action.type) {
        case NEW_REVIEW_REQUEST:
            return { loading: true };
        case NEW_REVIEW_SUCCESS:
            return { loading: false, success: true };
        case NEW_REVIEW_FAIL:
            return { loading: false, error: action.payload };
        case NEW_REVIEW_RESET:
            return {};
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

// Editing or deleting an existing review
export const reviewReducer = (state = {}, action) => {
    switch (action.type) {
        case UPDATE_REVIEW_REQUEST:
        case DELETE_REVIEW_REQUEST:
            return { ...state, loading: true };
        case UPDATE_REVIEW_SUCCESS:
            return { ...state, loading: false, isUpdated: true };
        case DELETE_REVIEW_SUCCESS:
            return { ...state, loading: false, isDeleted: true };
        case UPDATE_REVIEW_FAIL:
        case DELETE_REVIEW_FAIL:
            return { ...state, loading: false, error: action.payload };
        case UPDATE_REVIEW_RESET:
            return { ...state, isUpdated: false };
        case DELETE_REVIEW_RESET:
            return { ...state, isDeleted: false };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};
// MP3 · Review ratings — review thunks.
// Loads product reviews/status and submits create/update/delete calls to the review API.
import api from '../api';
import { getErrorMessage } from '../Utils/helpers';
import { getProductDetails } from './productActions';
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
} from '../constants/reviewConstants';

let latestReviewsRequest = 0;

// filters: { rating, withComment, size, color }. Empty values are left out.
export const getProductReviews =
    (productId, filters = {}) =>
    async (dispatch) => {
        // If the filters change while a request is running, the older response is ignored
        const requestId = ++latestReviewsRequest;

        const params = {};
        if (filters.rating) params.rating = filters.rating;
        if (filters.withComment) params.withComment = 'true';
        if (filters.size) params.size = filters.size;
        if (filters.color) params.color = filters.color;

        try {
            dispatch({ type: PRODUCT_REVIEWS_REQUEST });
            const { data } = await api.get(`/product/${productId}/reviews`, { params });
            if (requestId !== latestReviewsRequest) return;
            dispatch({
                type: PRODUCT_REVIEWS_SUCCESS,
                payload: {
                    productId,
                    reviews: data.reviews,
                    summary: data.summary,
                    variantOptions: data.variantOptions,
                },
            });
        } catch (error) {
            if (requestId !== latestReviewsRequest) return;
            dispatch({ type: PRODUCT_REVIEWS_FAIL, payload: getErrorMessage(error) });
        }
    };

// Can this customer review the product, and have they already?
export const getReviewStatus = (productId) => async (dispatch) => {
    try {
        dispatch({ type: REVIEW_STATUS_REQUEST });
        const { data } = await api.get(`/product/${productId}/review-status`);
        dispatch({
            type: REVIEW_STATUS_SUCCESS,
            payload: { productId, canReview: data.canReview, review: data.review },
        });
    } catch (error) {
        dispatch({ type: REVIEW_STATUS_FAIL, payload: getErrorMessage(error) });
    }
};

// After a review is added, edited, or deleted: reload the list, the form state,
// and the product's average rating (without blanking the page)
export const refreshProductReviews = (productId, filters) => (dispatch) => {
    dispatch(getProductReviews(productId, filters));
    dispatch(getReviewStatus(productId));
    dispatch(getProductDetails(productId, true));
};

// The three actions below return an error message, or null when it worked
export const submitReview = (productId, reviewData) => async () => {
    try {
        await api.post(`/product/${productId}/review`, reviewData);
        return null;
    } catch (error) {
        return getErrorMessage(error);
    }
};

export const updateReview = (reviewId, reviewData) => async () => {
    try {
        await api.put(`/review/${reviewId}`, reviewData);
        return null;
    } catch (error) {
        return getErrorMessage(error);
    }
};

export const deleteReview = (reviewId) => async () => {
    try {
        await api.delete(`/review/${reviewId}`);
        return null;
    } catch (error) {
        return getErrorMessage(error);
    }
};

export const getAdminReviews = () => async (dispatch) => {
    try {
        dispatch({ type: ADMIN_REVIEWS_REQUEST });
        const { data } = await api.get('/admin/reviews');
        dispatch({ type: ADMIN_REVIEWS_SUCCESS, payload: data.reviews });
    } catch (error) {
        dispatch({ type: ADMIN_REVIEWS_FAIL, payload: getErrorMessage(error) });
    }
};

// The logged-in customer's own reviews
export const getMyReviews = () => async (dispatch) => {
    try {
        dispatch({ type: MY_REVIEWS_REQUEST });
        const { data } = await api.get('/reviews/me');
        dispatch({ type: MY_REVIEWS_SUCCESS, payload: data.reviews });
    } catch (error) {
        dispatch({ type: MY_REVIEWS_FAIL, payload: getErrorMessage(error) });
    }
};

// The "My reviews" page: the customer's reviews together with the product each one is about
export const getMyReviewList = () => async (dispatch) => {
    try {
        dispatch({ type: MY_REVIEW_LIST_REQUEST });
        const { data } = await api.get('/reviews/me/details');
        dispatch({ type: MY_REVIEW_LIST_SUCCESS, payload: data.reviews });
    } catch (error) {
        dispatch({ type: MY_REVIEW_LIST_FAIL, payload: getErrorMessage(error) });
    }
};

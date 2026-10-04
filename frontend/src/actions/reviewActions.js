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
} from '../constants/reviewConstants';

export const getProductReviews = (productId) => async (dispatch) => {
    try {
        dispatch({ type: PRODUCT_REVIEWS_REQUEST });
        const { data } = await api.get(`/product/${productId}/reviews`);
        dispatch({ type: PRODUCT_REVIEWS_SUCCESS, payload: { productId, reviews: data.reviews } });
    } catch (error) {
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
export const refreshProductReviews = (productId) => (dispatch) => {
    dispatch(getProductReviews(productId));
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

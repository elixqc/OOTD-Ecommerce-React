// EXTRA · Wishlist — wishlist thunks.
// getWishlist/addToWishlist/removeFromWishlist call the wishlist API and update the heart state.
import api from '../api';
import { getErrorMessage } from '../Utils/helpers';
import {
    WISHLIST_REQUEST,
    WISHLIST_SUCCESS,
    WISHLIST_FAIL,
    WISHLIST_ADD,
    WISHLIST_REMOVE,
} from '../constants/wishlistConstants';

export const getWishlist = () => async (dispatch) => {
    try {
        dispatch({ type: WISHLIST_REQUEST });
        const { data } = await api.get('/wishlist');
        dispatch({ type: WISHLIST_SUCCESS, payload: data.wishlist });
    } catch (error) {
        dispatch({ type: WISHLIST_FAIL, payload: getErrorMessage(error) });
    }
};

// Like addToCart: returns an error message, or null when it worked.
// The heart fills in immediately and is undone if the server says no.
export const addToWishlist = (product) => async (dispatch) => {
    dispatch({ type: WISHLIST_ADD, payload: product });
    try {
        await api.post(`/wishlist/${product._id}`);
        return null;
    } catch (error) {
        dispatch({ type: WISHLIST_REMOVE, payload: product._id });
        return getErrorMessage(error);
    }
};

export const removeFromWishlist = (productId) => async (dispatch) => {
    dispatch({ type: WISHLIST_REMOVE, payload: productId });
    try {
        await api.delete(`/wishlist/${productId}`);
        return null;
    } catch (error) {
        dispatch(getWishlist()); // put the real list back
        return getErrorMessage(error);
    }
};

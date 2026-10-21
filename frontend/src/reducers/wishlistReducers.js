// EXTRA · Wishlist — wishlist state.
// Holds the saved product ids read by every heart button.
import {
    WISHLIST_REQUEST,
    WISHLIST_SUCCESS,
    WISHLIST_FAIL,
    WISHLIST_ADD,
    WISHLIST_REMOVE,
} from '../constants/wishlistConstants';
import { CLEAR_ERRORS, LOGOUT_SUCCESS } from '../constants/userConstants';

const initialState = { items: [], loading: false, loaded: false, error: null };

// items are full product objects (newest saved first), so the wishlist page can show product cards
export const wishlistReducer = (state = initialState, action) => {
    switch (action.type) {
        case WISHLIST_REQUEST:
            return { ...state, loading: true };
        case WISHLIST_SUCCESS:
            return { items: action.payload, loading: false, loaded: true, error: null };
        case WISHLIST_FAIL:
            return { ...state, loading: false, error: action.payload };

        case WISHLIST_ADD:
            if (state.items.some((p) => p._id === action.payload._id)) return state;
            return { ...state, items: [action.payload, ...state.items] };
        case WISHLIST_REMOVE:
            return { ...state, items: state.items.filter((p) => p._id !== action.payload) };

        // A wishlist must never carry over to the next person on this browser
        case LOGOUT_SUCCESS:
            return initialState;
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

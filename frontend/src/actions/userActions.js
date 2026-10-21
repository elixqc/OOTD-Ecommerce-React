// Q4 · Clerk login + U1-B · Validation — auth/profile/user thunks.
// syncUser maps the Clerk session to our DB user; updateMyProfile and admin user actions call /api/v1.
import api from '../api';
import { getErrorMessage } from '../Utils/helpers';
import {
    LOGIN_REQUEST,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    LOGOUT_SUCCESS,
    LOGOUT_FAIL,
    UPDATE_PROFILE_REQUEST,
    UPDATE_PROFILE_SUCCESS,
    UPDATE_PROFILE_FAIL,
    CLEAR_ERRORS,
    ALL_USERS_REQUEST,
    ALL_USERS_SUCCESS,
    ALL_USERS_FAIL,
    USER_DETAILS_REQUEST,
    USER_DETAILS_SUCCESS,
    USER_DETAILS_FAIL,
    UPDATE_USER_REQUEST,
    UPDATE_USER_SUCCESS,
    UPDATE_USER_FAIL,
} from '../constants/userConstants';
import { CLEAR_CART } from '../constants/cartConstants';
import { loadUserCart } from './cartActions';
// Gets the MongoDB user for the signed-in Clerk user, registering them first if they're new
let pendingProfile = null;

const fetchProfile = () => {
    if (pendingProfile) return pendingProfile;
    pendingProfile = (async () => {
        try {
            const { data } = await api.get('/me');
            return data.user;
        } catch (err) {
            if (err.response?.status !== 404) throw err;
            const { data } = await api.post('/register', {});
            return data.user;
        }
    })().finally(() => {
        pendingProfile = null;
    });
    return pendingProfile;
};

// Runs when Clerk finishes loading and whenever the sign-in state changes
export const syncUser = (isSignedIn) => async (dispatch) => {
    if (!isSignedIn) {
        dispatch({ type: LOGOUT_SUCCESS });
        return;
    }
    try {
        dispatch({ type: LOGIN_REQUEST });
        const user = await fetchProfile();
        dispatch({ type: LOGIN_SUCCESS, payload: user });
        dispatch(loadUserCart(user));
    } catch (error) {
        dispatch({ type: LOGIN_FAIL, payload: getErrorMessage(error) });
    }
};

export const logout = () => async (dispatch) => {
    try {
        await window.Clerk.signOut();
        dispatch({ type: LOGOUT_SUCCESS });
        dispatch({ type: CLEAR_CART });
        try {
            localStorage.removeItem('cartItems');
        } catch {
            // storage blocked, nothing to remove
        }
    } catch (error) {
        dispatch({ type: LOGOUT_FAIL, payload: getErrorMessage(error) });
    }
};

// Returns true when the profile was saved
export const updateMyProfile = (userData) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_PROFILE_REQUEST });
        const { data } = await api.put('/me/update', userData);
        dispatch({ type: UPDATE_PROFILE_SUCCESS, payload: data.user });
        return true;
    } catch (error) {
        dispatch({ type: UPDATE_PROFILE_FAIL, payload: getErrorMessage(error) });
        return false;
    }
};

export const clearErrors = () => (dispatch) => {
    dispatch({ type: CLEAR_ERRORS });
};

export const getAllUsers = () => async (dispatch) => {
    try {
        dispatch({ type: ALL_USERS_REQUEST });
        const { data } = await api.get('/admin/users');
        dispatch({ type: ALL_USERS_SUCCESS, payload: data.users });
    } catch (error) {
        dispatch({ type: ALL_USERS_FAIL, payload: getErrorMessage(error) });
    }
};

export const getUserDetails = (id) => async (dispatch) => {
    try {
        dispatch({ type: USER_DETAILS_REQUEST });
        const { data } = await api.get(`/admin/user/${id}`);
        dispatch({
            type: USER_DETAILS_SUCCESS,
            payload: {
                user: data.user,
                orderCount: data.orderCount,
                totalSpent: data.totalSpent,
                recentOrders: data.recentOrders,
            },
        });
    } catch (error) {
        dispatch({ type: USER_DETAILS_FAIL, payload: getErrorMessage(error) });
    }
};

// isActive: true activates the account, false deactivates it
export const updateUser = (id, isActive) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_USER_REQUEST });
        const { data } = await api.put(`/admin/user/${id}`, { isActive });
        dispatch({ type: UPDATE_USER_SUCCESS, payload: data.user });
    } catch (error) {
        dispatch({ type: UPDATE_USER_FAIL, payload: getErrorMessage(error) });
    }
};

// role: 'admin' or 'customer'
export const updateUserRole = (id, role) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_USER_REQUEST });
        const { data } = await api.put(`/admin/user/${id}`, { role });
        dispatch({ type: UPDATE_USER_SUCCESS, payload: data.user });
    } catch (error) {
        dispatch({ type: UPDATE_USER_FAIL, payload: getErrorMessage(error) });
    }
};

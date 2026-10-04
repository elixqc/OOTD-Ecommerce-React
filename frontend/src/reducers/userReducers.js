import {
    LOGIN_REQUEST,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    REGISTER_USER_REQUEST,
    REGISTER_USER_SUCCESS,
    REGISTER_USER_FAIL,
    LOAD_USER_SUCCESS,
    LOAD_USER_FAIL,
    LOGOUT_SUCCESS,
    LOGOUT_FAIL,
    UPDATE_PROFILE_REQUEST,
    UPDATE_PROFILE_SUCCESS,
    UPDATE_PROFILE_FAIL,
    UPDATE_PROFILE_RESET,
    CLEAR_ERRORS,
    FORGOT_PASSWORD_REQUEST,
    FORGOT_PASSWORD_SUCCESS,
    FORGOT_PASSWORD_FAIL,
    FORGOT_PASSWORD_RESET,
} from '../constants/userConstants';

// loading starts as true because the session is restored when the app opens
const initialState = {
    loading: true,
    isAuthenticated: false,
    user: null,
    error: null,
};

export const authReducer = (state = initialState, action) => {
    switch (action.type) {
        case LOGIN_REQUEST:
        case REGISTER_USER_REQUEST:
            return { loading: true, isAuthenticated: false, user: null, error: null };

        case LOGIN_SUCCESS:
        case REGISTER_USER_SUCCESS:
        case LOAD_USER_SUCCESS:
            return { loading: false, isAuthenticated: true, user: action.payload, error: null };

        case LOGIN_FAIL:
        case REGISTER_USER_FAIL:
        case LOAD_USER_FAIL:
            return { loading: false, isAuthenticated: false, user: null, error: action.payload };

        case LOGOUT_SUCCESS:
            return { loading: false, isAuthenticated: false, user: null, error: null };

        case LOGOUT_FAIL:
            return { ...state, error: action.payload };

        // The saved profile comes back from the server, so the header and shipping form use it
        case UPDATE_PROFILE_SUCCESS:
            return { ...state, user: action.payload };

        case CLEAR_ERRORS:
            return { ...state, error: null };

        default:
            return state;
    }
};

// Profile update status
export const userReducer = (state = {}, action) => {
    switch (action.type) {
        case UPDATE_PROFILE_REQUEST:
            return { ...state, loading: true, error: null };
        case UPDATE_PROFILE_SUCCESS:
            return { loading: false, isUpdated: true, error: null };
        case UPDATE_PROFILE_FAIL:
            return { ...state, loading: false, error: action.payload };
        case UPDATE_PROFILE_RESET:
            return { ...state, isUpdated: false };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

export const forgotPasswordReducer = (state = {}, action) => {
    switch (action.type) {
        case FORGOT_PASSWORD_REQUEST:
            return { loading: true, error: null, message: null };
        case FORGOT_PASSWORD_SUCCESS:
            return { loading: false, message: action.payload };
        case FORGOT_PASSWORD_FAIL:
            return { loading: false, error: action.payload };
        case FORGOT_PASSWORD_RESET:
            return {};
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};
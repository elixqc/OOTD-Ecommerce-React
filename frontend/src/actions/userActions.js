import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import api from '../api';
import { getErrorMessage } from '../Utils/helpers';
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    sendPasswordResetEmail,
    updatePassword as firebaseUpdatePassword,
} from 'firebase/auth';
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
    CLEAR_ERRORS,
    FORGOT_PASSWORD_REQUEST,
    FORGOT_PASSWORD_SUCCESS,
    FORGOT_PASSWORD_FAIL,
    ALL_USERS_REQUEST,
    ALL_USERS_SUCCESS,
    ALL_USERS_FAIL,
    USER_DETAILS_REQUEST,
    USER_DETAILS_SUCCESS,
    USER_DETAILS_FAIL,
    UPDATE_PASSWORD_REQUEST,
    UPDATE_PASSWORD_SUCCESS,
    UPDATE_PASSWORD_FAIL,
    UPDATE_USER_REQUEST,
    UPDATE_USER_SUCCESS,
    UPDATE_USER_FAIL,
} from '../constants/userConstants';

// True while a login/register is running, so the auth listener doesn't load the user twice
let manualAuth = false;

// Gets the MongoDB user for the signed-in Firebase user, registering them first if they're new
const fetchProfile = async (firebaseUser) => {
    try {
        const { data } = await api.get('/me');
        return data.user;
    } catch (err) {
        if (err.response?.status !== 404) throw err;
        const name = firebaseUser.displayName || firebaseUser.email.split('@')[0];
        const { data } = await api.post('/register', { name });
        return data.user;
    }
};

// Shared by login, Google login, and register
const runAuth = (requestType, successType, failType, signIn) => async (dispatch) => {
    manualAuth = true;
    try {
        dispatch({ type: requestType });
        const firebaseUser = await signIn();
        const user = await fetchProfile(firebaseUser);
        dispatch({ type: successType, payload: user });
    } catch (error) {
        await signOut(auth);
        dispatch({ type: failType, payload: getErrorMessage(error) });
    } finally {
        manualAuth = false;
    }
};

export const login = (email, password) =>
    runAuth(LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAIL, async () => {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        return credential.user;
    });

export const loginWithGoogle = () =>
    runAuth(LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAIL, async () => {
        const credential = await signInWithPopup(auth, googleProvider);
        return credential.user;
    });

export const register = (name, email, password) =>
    runAuth(REGISTER_USER_REQUEST, REGISTER_USER_SUCCESS, REGISTER_USER_FAIL, async () => {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name });
        return credential.user;
    });

// Restores the session when the page loads. Returns the unsubscribe function.
export const listenToAuthChanges = () => (dispatch, getState) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (manualAuth) return;

        if (!firebaseUser) {
            if (getState().auth.loading) {
                dispatch({ type: LOAD_USER_FAIL, payload: null });
            }
            return;
        }

        try {
            const user = await fetchProfile(firebaseUser);
            dispatch({ type: LOAD_USER_SUCCESS, payload: user });
        } catch (error) {
            await signOut(auth);
            dispatch({ type: LOAD_USER_FAIL, payload: getErrorMessage(error) });
        }
    });
};

export const logout = () => async (dispatch) => {
    try {
        await signOut(auth);
        dispatch({ type: LOGOUT_SUCCESS });
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

const RESET_SENT_MESSAGE = 'If an account exists for that email, we sent a link to reset your password.';

// Firebase sends the email. An unknown email gets the same message,
// so this form can't be used to find out who has an account.
export const forgotPassword = (email) => async (dispatch) => {
    try {
        dispatch({ type: FORGOT_PASSWORD_REQUEST });
        await sendPasswordResetEmail(auth, email, { url: `${window.location.origin}/login` });
        dispatch({ type: FORGOT_PASSWORD_SUCCESS, payload: RESET_SENT_MESSAGE });
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            dispatch({ type: FORGOT_PASSWORD_SUCCESS, payload: RESET_SENT_MESSAGE });
            return;
        }
        const message = error.code === 'auth/invalid-email' ? 'Enter a valid email' : getErrorMessage(error);
        dispatch({ type: FORGOT_PASSWORD_FAIL, payload: message });
    }
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
        dispatch({ type: USER_DETAILS_SUCCESS, payload: { user: data.user, orderCount: data.orderCount } });
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


// Firebase wants a recent login before a password change, so the old password is checked first
export const updatePassword = (oldPassword, newPassword) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_PASSWORD_REQUEST });
        const current = auth.currentUser;
        const credential = EmailAuthProvider.credential(current.email, oldPassword);
        await reauthenticateWithCredential(current, credential);
        await firebaseUpdatePassword(current, newPassword);
        dispatch({ type: UPDATE_PASSWORD_SUCCESS });
    } catch (error) {
        let message = getErrorMessage(error);
        if (['auth/wrong-password', 'auth/invalid-credential'].includes(error.code)) {
            message = 'Your old password is incorrect';
        } else if (error.code === 'auth/weak-password') {
            message = 'The new password is too weak';
        } else if (error.code === 'auth/too-many-requests') {
            message = 'Too many attempts. Try again later';
        }
        dispatch({ type: UPDATE_PASSWORD_FAIL, payload: message });
    }
};

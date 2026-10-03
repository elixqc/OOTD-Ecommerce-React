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
    CLEAR_ERRORS,
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

export const clearErrors = () => (dispatch) => {
    dispatch({ type: CLEAR_ERRORS });
};
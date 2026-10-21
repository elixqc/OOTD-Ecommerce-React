// CORE · Shared helpers — date/money formatting and toast wrappers.
// formatDate/peso are used across orders, dashboard and cards; notify* wrap sonner toasts.
import { toast } from 'sonner';

export const notifySuccess = (title) => toast.success(title);
export const notifyError = (title) => toast.error(title);
export const notifyInfo = (title) => toast.info(title);

export const peso = (amount) => `₱${(Math.round(amount * 100) / 100).toLocaleString()}`;

export const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

// "#A1B2C3" from a long MongoDB id
export const shortOrderId = (id) => `#${String(id).slice(-6).toUpperCase()}`;

const FIREBASE_MESSAGES = {
    'auth/invalid-credential': 'Invalid email or password',
    'auth/user-not-found': 'Invalid email or password',
    'auth/wrong-password': 'Invalid email or password',
    'auth/email-already-in-use': 'That email is already registered',
    'auth/weak-password': 'Password must be at least 6 characters',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    'auth/popup-closed-by-user': 'Sign-in was cancelled',
    'auth/network-request-failed': 'Network error. Check your connection',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase',
    'auth/user-disabled': 'This account has been deactivated',
};

// Prefers the backend's message, then a friendly Firebase message
export const getErrorMessage = (err) =>
    err.response?.data?.message ||
    FIREBASE_MESSAGES[err.code] ||
    err.message ||
    'Something went wrong';

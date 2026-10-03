import Swal from 'sweetalert2';

const Toast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: { popup: 'ootd-toast' },
});

export const notifySuccess = (title) => Toast.fire({ icon: 'success', title });
export const notifyError = (title) => Toast.fire({ icon: 'error', title });

// Returns true if the admin confirms
export const confirmDelete = async (text) => {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#c8553d',
        confirmButtonText: 'Yes, delete',
    });
    return result.isConfirmed;
};

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
};

// Prefers the backend's message, then a friendly Firebase message
export const getErrorMessage = (err) =>
    err.response?.data?.message || FIREBASE_MESSAGES[err.code] || err.message || 'Something went wrong';
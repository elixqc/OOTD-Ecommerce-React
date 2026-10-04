import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, Card, TextField, Typography } from '@mui/material';
import { clearErrors, updatePassword } from '../../actions/userActions';
import { UPDATE_PASSWORD_RESET } from '../../constants/userConstants';
import { auth } from '../../firebase';
import { notifyError, notifySuccess } from '../../Utils/helpers';

const validationSchema = Yup.object({
    oldPassword: Yup.string().required('Enter your old password'),
    newPassword: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .notOneOf([Yup.ref('oldPassword')], 'New password must be different from the old one')
        .required('Enter a new password'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords do not match')
        .required('Confirm your new password'),
});

export default function UpdatePassword() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isUpdated } = useSelector((state) => state.updatePassword);

    // Google accounts have no password to change
    const hasPassword = auth.currentUser?.providerData.some((p) => p.providerId === 'password');

    useEffect(() => {
        if (error) {
            notifyError(error);
            dispatch(clearErrors());
        }
    }, [error, dispatch]);

    useEffect(() => {
        if (isUpdated) {
            notifySuccess('Password updated');
            dispatch({ type: UPDATE_PASSWORD_RESET });
            navigate('/me');
        }
    }, [isUpdated, dispatch, navigate]);

    const formik = useFormik({
        initialValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: (values) => dispatch(updatePassword(values.oldPassword, values.newPassword)),
    });

    const field = (name, label, autoComplete) => ({
        name,
        label,
        type: 'password',
        autoComplete,
        fullWidth: true,
        value: formik.values[name],
        onChange: formik.handleChange,
        error: Boolean(formik.errors[name]),
        helperText: formik.errors[name],
    });

    return (
        <div className="auth-wrapper">
            <Card className="auth-card">
                <Typography variant="h5" component="h1" className="auth-title">
                    Change password
                </Typography>

                {hasPassword ? (
                    <form onSubmit={formik.handleSubmit} noValidate className="form-stack">
                        <TextField {...field('oldPassword', 'Old password', 'current-password')} />
                        <TextField {...field('newPassword', 'New password', 'new-password')} />
                        <TextField {...field('confirmPassword', 'Confirm new password', 'new-password')} />
                        <Button type="submit" variant="contained" disabled={loading}>
                            {loading ? 'Updating...' : 'Update password'}
                        </Button>
                        <Button component={Link} to="/me">
                            Cancel
                        </Button>
                    </form>
                ) : (
                    <div className="form-stack">
                        <Typography>
                            You signed in with Google, so there's no password to change here.
                        </Typography>
                        <Button variant="contained" component={Link} to="/me">
                            Back to profile
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}

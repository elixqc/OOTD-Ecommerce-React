import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, Card, TextField, Typography } from '@mui/material';
import { clearErrors, forgotPassword } from '../../actions/userActions';
import { FORGOT_PASSWORD_RESET } from '../../constants/userConstants';
import { notifyError } from '../../Utils/helpers';

const validationSchema = Yup.object({
    email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
});

export default function ForgotPassword() {
    const dispatch = useDispatch();
    const { loading, error, message } = useSelector((state) => state.forgotPassword);

    // Start fresh, so an old confirmation isn't shown
    useEffect(() => {
        dispatch({ type: FORGOT_PASSWORD_RESET });
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            notifyError(error);
            dispatch(clearErrors());
        }
    }, [error, dispatch]);

    const formik = useFormik({
        initialValues: { email: '' },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: (values) => dispatch(forgotPassword(values.email.trim())),
    });

    return (
        <div className="auth-wrapper">
            <Card className="auth-card">
                <Typography variant="h5" component="h1" className="auth-title">
                    Forgot password
                </Typography>

                {message ? (
                    <div className="form-stack">
                        <Typography>{message}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Check your inbox and spam folder. The link opens a page where you can choose a new password.
                        </Typography>
                        <Button variant="contained" component={Link} to="/login">
                            Back to login
                        </Button>
                        <Button onClick={() => dispatch({ type: FORGOT_PASSWORD_RESET })}>Use a different email</Button>
                    </div>
                ) : (
                    <>
                        <form onSubmit={formik.handleSubmit} noValidate className="form-stack">
                            <Typography variant="body2" color="text.secondary">
                                Enter your email and we'll send you a link to reset your password.
                            </Typography>
                            <TextField
                                label="Email"
                                name="email"
                                type="text"
                                inputMode="email"
                                autoComplete="email"
                                fullWidth
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                error={Boolean(formik.errors.email)}
                                helperText={formik.errors.email}
                            />
                            <Button type="submit" variant="contained" disabled={loading}>
                                {loading ? 'Sending...' : 'Send reset link'}
                            </Button>
                        </form>

                        <Typography variant="body2" className="auth-footer">
                            <Link to="/login">Back to login</Link>
                        </Typography>
                    </>
                )}
            </Card>
        </div>
    );
}
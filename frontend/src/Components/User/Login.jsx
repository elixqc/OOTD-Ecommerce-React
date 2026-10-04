import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, Card, Divider, TextField, Typography } from '@mui/material';
import { clearErrors, login, loginWithGoogle } from '../../actions/userActions';
import { notifyError, notifySuccess } from '../../Utils/helpers';

const validationSchema = Yup.object({
    email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
    password: Yup.string().required('Password is required'),
});

export default function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.from?.pathname || '/';
    const { isAuthenticated, error, loading } = useSelector((state) => state.auth);
    const attempted = useRef(false); // so the welcome toast only shows after a real login

    useEffect(() => {
        if (isAuthenticated) {
            if (attempted.current) notifySuccess('Welcome back!');
            navigate(redirectTo, { replace: true });
        }
        if (error) {
            notifyError(error);
            dispatch(clearErrors());
        }
    }, [isAuthenticated, error, dispatch, navigate, redirectTo]);

    const formik = useFormik({
        initialValues: { email: '', password: '' },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: (values) => {
            attempted.current = true;
            return dispatch(login(values.email.trim(), values.password));
        },
    });

    const handleGoogle = () => {
        attempted.current = true;
        dispatch(loginWithGoogle());
    };

    return (
        <div className="auth-wrapper">
            <Card className="auth-card">
                <Typography variant="h5" component="h1" className="auth-title">
                    Login
                </Typography>

                <form onSubmit={formik.handleSubmit} noValidate className="form-stack">
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
                    <TextField
                        label="Password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        fullWidth
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        error={Boolean(formik.errors.password)}
                        helperText={formik.errors.password}
                    />
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? 'Please wait...' : 'Login'}
                    </Button>
                    <Divider>or</Divider>
                    <Button variant="outlined" onClick={handleGoogle} disabled={loading}>
                        Continue with Google
                    </Button>
                </form>

                <Typography variant="body2" className="auth-footer">
                    <Link to="/password/forgot">Forgot your password?</Link>
                    <br />
                    No account yet? <Link to="/register">Register</Link>
                </Typography>
            </Card>
        </div>
    );
}
import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, Card, Divider, TextField, Typography } from '@mui/material';
import { clearErrors, loginWithGoogle, register } from '../../actions/userActions';
import { notifyError, notifySuccess } from '../../Utils/helpers';

const validationSchema = Yup.object({
    name: Yup.string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name cannot exceed 50 characters')
        .required('Name is required'),
    email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
    password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords do not match')
        .required('Please confirm your password'),
});

export default function Register() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, error, loading } = useSelector((state) => state.auth);
    const attempted = useRef(false);

    useEffect(() => {
        if (isAuthenticated) {
            if (attempted.current) notifySuccess('Welcome to OOTD!');
            navigate('/', { replace: true });
        }
        if (error) {
            notifyError(error);
            dispatch(clearErrors());
        }
    }, [isAuthenticated, error, dispatch, navigate]);

    const formik = useFormik({
        initialValues: { name: '', email: '', password: '', confirmPassword: '' },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: (values) => {
            attempted.current = true;
            return dispatch(register(values.name.trim(), values.email.trim(), values.password));
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
                    Create an account
                </Typography>

                <form onSubmit={formik.handleSubmit} noValidate className="form-stack">
                    <TextField
                        label="Full name"
                        name="name"
                        autoComplete="name"
                        fullWidth
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        error={Boolean(formik.errors.name)}
                        helperText={formik.errors.name}
                    />
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
                        autoComplete="new-password"
                        fullWidth
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        error={Boolean(formik.errors.password)}
                        helperText={formik.errors.password}
                    />
                    <TextField
                        label="Confirm password"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        fullWidth
                        value={formik.values.confirmPassword}
                        onChange={formik.handleChange}
                        error={Boolean(formik.errors.confirmPassword)}
                        helperText={formik.errors.confirmPassword}
                    />
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? 'Please wait...' : 'Register'}
                    </Button>
                    <Divider>or</Divider>
                    <Button variant="outlined" onClick={handleGoogle} disabled={loading}>
                        Continue with Google
                    </Button>
                </form>

                <Typography variant="body2" className="auth-footer">
                    Already have an account? <Link to="/login">Login</Link>
                </Typography>
            </Card>
        </div>
    );
}
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, Divider, InputAdornment, Link, TextField } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import AuthLayout from './AuthLayout';
import PasswordField from './PasswordField';
import { notifyError, notifySuccess } from '../../Utils/helpers';
import FacebookIcon from '@mui/icons-material/Facebook';

const validationSchema = Yup.object({
    email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
    password: Yup.string().required('Password is required'),
});

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.from?.pathname || '/';
    const { signIn, fetchStatus } = useSignIn();
    const loading = fetchStatus === 'fetching';

    const formik = useFormik({
        initialValues: { email: '', password: '' },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: async (values) => {
            const { error } = await signIn.password({
                emailAddress: values.email.trim(),
                password: values.password,
            });
            if (error) {
                notifyError(error.longMessage || error.message);
                return;
            }
            if (signIn.status === 'complete') {
                await signIn.finalize({
                    navigate: () => {
                        notifySuccess('Welcome back!');
                        navigate(redirectTo, { replace: true });
                    },
                });
            } else {
                notifyError(`Sign-in not complete (${signIn.status})`);
            }
        },
    });

    const handleGoogle = async () => {
        const { error } = await signIn.sso({
            strategy: 'oauth_google',
            redirectUrl: '/',
            redirectCallbackUrl: '/sso-callback',
        });
        if (error) notifyError(error.longMessage || error.message);
    };

    const handleFacebook = async () => {
        const { error } = await signIn.sso({
            strategy: 'oauth_facebook',
            redirectUrl: '/',
            redirectCallbackUrl: '/sso-callback',
        });
        if (error) notifyError(error.longMessage || error.message);
    };

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Login to your OOTD account"
            footer={
                <>
                    No account yet?{' '}
                    <Link component={RouterLink} to="/register" color="secondary" underline="hover" fontWeight={600}>
                        Register
                    </Link>
                </>
            }
        >
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
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailOutlinedIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <PasswordField
                    label="Password"
                    name="password"
                    autoComplete="current-password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.password)}
                    helperText={formik.errors.password}
                />
                <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                    {loading ? 'Please wait...' : 'Login'}
                </Button>
                <Divider>or</Divider>
                <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    startIcon={<GoogleIcon />}
                    onClick={handleGoogle}
                    disabled={loading}
                >
                    Continue with Google
                </Button>
                                <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    startIcon={<FacebookIcon />}
                    onClick={handleFacebook}
                    disabled={loading}
                >
                    Continue with Facebook
                </Button>
            </form>
        </AuthLayout>
    );
}
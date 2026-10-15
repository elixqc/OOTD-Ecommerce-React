import { useLocation, useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Button, Divider, InputAdornment, TextField } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import AuthHeading from './AuthHeading';
import AuthSwitch from './AuthSwitch';
import SocialButtons from './SocialButtons';
import { staggerFields } from './authMotion';
import PasswordField from './PasswordField';
import { notifyError, notifySuccess } from '../../Utils/helpers';

const validationSchema = Yup.object({
    email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
    password: Yup.string().required('Password is required'),
});

export default function Login({ active = true }) {
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
        <>
            <AuthHeading title="Welcome back" subtitle="Login to your OOTD account" />
            <Box
                component="form"
                onSubmit={formik.handleSubmit}
                noValidate
                sx={{ display: 'flex', flexDirection: 'column', gap: 2, ...staggerFields(active) }}
            >
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
                <SocialButtons onGoogle={handleGoogle} onFacebook={handleFacebook} disabled={loading} />
                <AuthSwitch prompt="Don't have an account?" cta="Sign up" to="/register" />
            </Box>
        </>
    );
}
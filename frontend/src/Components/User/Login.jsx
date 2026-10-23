// Q4 · Clerk login + U1-B · Validation — sign-in form.
// Formik + Yup validated; signs in via Clerk and offers the Google social button.
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/react';
import { getIn, useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Button, Divider, InputAdornment, Link, TextField } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import AuthHeading from './AuthHeading';
import AuthSwitch from './AuthSwitch';
import SocialButtons from './SocialButtons';
import { staggerFields } from './authMotion';
import { useDispatch } from 'react-redux';
import { getPostLoginPath, syncUser } from '../../actions/userActions';
import PasswordField from './PasswordField';
import { notifyError, notifySuccess } from '../../Utils/helpers';

const validationSchema = Yup.object({
    email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
    password: Yup.string().required('Password is required'),
});

export default function Login({ active = true }) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const redirectTo = location.state?.from?.pathname || '/';
    const { signIn, fetchStatus } = useSignIn();
    const loading = fetchStatus === 'fetching';

    const formik = useFormik({
        initialValues: { email: '', password: '' },
        validationSchema,
        validateOnChange: true,
        validateOnBlur: true,
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
                // finalize()'s navigate callback runs BEFORE the session is active, so
                // calling /me from inside it has no token and fails. Just capture
                // decorateUrl there, then sync our database user and route by role.
                let decorate = (url) => url;
                const finalized = await signIn.finalize({
                    navigate: ({ decorateUrl }) => {
                        decorate = decorateUrl;
                    },
                });
                if (finalized.error) {
                    notifyError(finalized.error.longMessage || finalized.error.message);
                    return;
                }
                // Wait for our database user so we know whether this is an admin
                const user = await dispatch(syncUser(true));
                notifySuccess('Welcome back!');
                const target = decorate(getPostLoginPath(user, redirectTo));
                if (target.startsWith('http')) window.location.href = target;
                else navigate(target, { replace: true });
            } else {
                notifyError(`Sign-in not complete (${signIn.status})`);
            }
        },
    });

    // Reveal a field's error once it was blurred, or after any submit attempt
    const showError = (name) =>
        formik.submitCount > 0 || getIn(formik.touched, name) === true;
    const errorText = (name) => (showError(name) ? getIn(formik.errors, name) : undefined);

    const handleGoogle = async () => {
        const { error } = await signIn.sso({
            strategy: 'oauth_google',
            redirectUrl: '/sso-callback',
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
                    onBlur={formik.handleBlur}
                    error={Boolean(errorText('email'))}
                    helperText={errorText('email')}
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
                    onBlur={formik.handleBlur}
                    error={Boolean(errorText('password'))}
                    helperText={errorText('password')}
                />
                <Box sx={{ textAlign: 'right', mt: -1 }}>
                    <Link component={RouterLink} to="/forgot-password" variant="body2" underline="hover">
                        Forgot password?
                    </Link>
                </Box>
                <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                    {loading ? 'Please wait...' : 'Login'}
                </Button>
                <Divider>or</Divider>
                <SocialButtons onGoogle={handleGoogle} disabled={loading} />
                <AuthSwitch prompt="Don't have an account?" cta="Sign up" to="/register" />
            </Box>
        </>
    );
}

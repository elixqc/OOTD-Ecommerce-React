import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignUp } from '@clerk/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Button, Divider, InputAdornment, TextField } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import AuthHeading from './AuthHeading';
import AuthSwitch from './AuthSwitch';
import SocialButtons from './SocialButtons';
import { staggerFields } from './authMotion';
import PasswordField from './PasswordField';
import { notifyError, notifySuccess } from '../../Utils/helpers';

const validationSchema = Yup.object({
    firstName: Yup.string().trim().max(25, 'Too long').required('First name is required'),
    lastName: Yup.string().trim().max(25, 'Too long').required('Last name is required'),
    email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
    password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords do not match')
        .required('Please confirm your password'),
});

const codeSchema = Yup.object({
    code: Yup.string()
        .trim()
        .matches(/^[0-9]{6}$/, 'Enter the 6-digit code')
        .required('Enter the code we emailed you'),
});

const nameSlotProps = {
    input: {
        startAdornment: (
            <InputAdornment position="start">
                <PersonOutlinedIcon fontSize="small" />
            </InputAdornment>
        ),
    },
};

const errorText = (error) => error.longMessage || error.message;

export default function Register({ active = true }) {
    const navigate = useNavigate();
    const { signUp, fetchStatus } = useSignUp();
    const loading = fetchStatus === 'fetching';
    const [awaitingCode, setAwaitingCode] = useState(false);

    const formik = useFormik({
        initialValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: async (values) => {
            const created = await signUp.password({
                emailAddress: values.email.trim(),
                password: values.password,
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
            });
            if (created.error) {
                notifyError(errorText(created.error));
                return;
            }
            const sent = await signUp.verifications.sendEmailCode();
            if (sent.error) {
                notifyError(errorText(sent.error));
                return;
            }
            setAwaitingCode(true);
        },
    });

    const codeFormik = useFormik({
        initialValues: { code: '' },
        validationSchema: codeSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: async (values) => {
            const { error } = await signUp.verifications.verifyEmailCode({ code: values.code.trim() });
            if (error) {
                notifyError(errorText(error));
                return;
            }
            if (signUp.status === 'complete') {
                await signUp.finalize({
                    navigate: () => {
                        notifySuccess('Welcome to OOTD!');
                        navigate('/', { replace: true });
                    },
                });
            } else {
                notifyError(`Sign-up not complete (${signUp.status})`);
            }
        },
    });

    const resendCode = async () => {
        const { error } = await signUp.verifications.sendEmailCode();
        if (error) notifyError(errorText(error));
        else notifySuccess('A new code was sent');
    };

    const handleGoogle = async () => {
        const { error } = await signUp.sso({
            strategy: 'oauth_google',
            redirectUrl: '/',
            redirectCallbackUrl: '/sso-callback',
        });
        if (error) notifyError(errorText(error));
    };

    const handleFacebook = async () => {
        const { error } = await signUp.sso({
            strategy: 'oauth_facebook',
            redirectUrl: '/',
            redirectCallbackUrl: '/sso-callback',
        });
        if (error) notifyError(errorText(error));
    };

    const stack = { display: 'flex', flexDirection: 'column', gap: 2, ...staggerFields(active) };

    if (awaitingCode) {
        return (
            <>
                <AuthHeading
                    title="Check your email"
                    subtitle={`We sent a 6-digit code to ${formik.values.email.trim()}`}
                />
                <Box component="form" onSubmit={codeFormik.handleSubmit} noValidate sx={stack}>
                    <TextField
                        label="Verification code"
                        name="code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        fullWidth
                        value={codeFormik.values.code}
                        onChange={codeFormik.handleChange}
                        error={Boolean(codeFormik.errors.code)}
                        helperText={codeFormik.errors.code}
                    />
                    <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                        {loading ? 'Please wait...' : 'Verify and continue'}
                    </Button>
                    <Button onClick={resendCode} disabled={loading}>
                        Resend code
                    </Button>
                </Box>
            </>
        );
    }

    return (
        <>
            <AuthHeading title="Create your account" subtitle="Join OOTD and start shopping" />
            <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={stack}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        label="First name"
                        name="firstName"
                        autoComplete="given-name"
                        fullWidth
                        value={formik.values.firstName}
                        onChange={formik.handleChange}
                        error={Boolean(formik.errors.firstName)}
                        helperText={formik.errors.firstName}
                        slotProps={nameSlotProps}
                    />
                    <TextField
                        label="Last name"
                        name="lastName"
                        autoComplete="family-name"
                        fullWidth
                        value={formik.values.lastName}
                        onChange={formik.handleChange}
                        error={Boolean(formik.errors.lastName)}
                        helperText={formik.errors.lastName}
                        slotProps={nameSlotProps}
                    />
                </Box>
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
                    autoComplete="new-password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.password)}
                    helperText={formik.errors.password}
                />
                <PasswordField
                    label="Confirm password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.confirmPassword)}
                    helperText={formik.errors.confirmPassword}
                />
                {/* Clerk's bot protection renders its captcha here when it is turned on */}
                <div id="clerk-captcha" />
                <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                    {loading ? 'Please wait...' : 'Create account'}
                </Button>
                <Divider>or</Divider>
                <SocialButtons onGoogle={handleGoogle} onFacebook={handleFacebook} disabled={loading} />
                <AuthSwitch prompt="Already a member?" cta="Login" to="/login" />
            </Box>
        </>
    );
}
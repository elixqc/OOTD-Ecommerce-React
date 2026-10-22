// Q4 · Clerk login + U1-B · Validation — password-reset flow.
// Three steps, all handled by Clerk: email, the code sent to that email, then the new password.
// Formik + Yup validated, like the login and register forms.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Button, InputAdornment, TextField } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import AuthHeading from './AuthHeading';
import AuthSwitch from './AuthSwitch';
import PasswordField from './PasswordField';
import { staggerFields } from './authMotion';
import { notifyError, notifySuccess } from '../../Utils/helpers';

const emailSchema = Yup.object({
    email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
});

const codeSchema = Yup.object({
    code: Yup.string()
        .trim()
        .matches(/^[0-9]{6}$/, 'Enter the 6-digit code')
        .required('Enter the code we emailed you'),
});

const passwordSchema = Yup.object({
    password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords do not match')
        .required('Please confirm your password'),
});

const errorText = (error) => error.longMessage || error.message;

const stack = { display: 'flex', flexDirection: 'column', gap: 2 };

export default function ForgotPassword({ active = true }) {
    const navigate = useNavigate();
    const { signIn, fetchStatus } = useSignIn();
    const loading = fetchStatus === 'fetching';
    const [step, setStep] = useState('email'); // 'email' -> 'code' -> 'password'
    const [email, setEmail] = useState('');

    // Step 1: find the account and email it a reset code
    const emailFormik = useFormik({
        initialValues: { email: '' },
        validationSchema: emailSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: async (values) => {
            const address = values.email.trim();
            const created = await signIn.create({ identifier: address });
            if (created.error) {
                notifyError(errorText(created.error));
                return;
            }
            const sent = await signIn.resetPasswordEmailCode.sendCode();
            if (sent.error) {
                notifyError(errorText(sent.error));
                return;
            }
            setEmail(address);
            setStep('code');
        },
    });

    // Step 2: check the code
    const codeFormik = useFormik({
        initialValues: { code: '' },
        validationSchema: codeSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: async (values) => {
            const { error } = await signIn.resetPasswordEmailCode.verifyCode({
                code: values.code.trim(),
            });
            if (error) {
                notifyError(errorText(error));
                return;
            }
            if (signIn.status === 'needs_new_password') {
                setStep('password');
            } else {
                notifyError(`Reset not complete (${signIn.status})`);
            }
        },
    });

    // Step 3: set the new password, which also signs the user in
    const passwordFormik = useFormik({
        initialValues: { password: '', confirmPassword: '' },
        validationSchema: passwordSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: async (values) => {
            const { error } = await signIn.resetPasswordEmailCode.submitPassword({
                password: values.password,
                signOutOfOtherSessions: true,
            });
            if (error) {
                notifyError(errorText(error));
                return;
            }
            if (signIn.status === 'complete') {
                await signIn.finalize({
                    navigate: () => {
                        notifySuccess('Password updated. Welcome back!');
                        navigate('/', { replace: true });
                    },
                });
            } else if (signIn.status === 'needs_second_factor') {
                // The password change itself worked; only the sign-in is waiting on a
                // second factor, which this page doesn't collect
                notifySuccess('Password updated.');
                notifyError('Your account needs two-factor authentication. Sign in to continue.');
                navigate('/login', { replace: true });
            } else {
                notifyError(`Reset not complete (${signIn.status})`);
            }
        },
    });

    const resendCode = async () => {
        const { error } = await signIn.resetPasswordEmailCode.sendCode();
        if (error) notifyError(errorText(error));
        else notifySuccess('A new code was sent');
    };

    let content;

    if (step === 'code') {
        content = (
            <>
                <AuthHeading title="Check your email" subtitle={`We sent a 6-digit code to ${email}`} />
                <Box
                    key="code"
                    component="form"
                    onSubmit={codeFormik.handleSubmit}
                    noValidate
                    sx={{ ...stack, ...staggerFields(active) }}
                >
                    <TextField
                        label="Verification code"
                        name="code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        fullWidth
                        slotProps={{ htmlInput: { maxLength: 6 } }}
                        value={codeFormik.values.code}
                        onChange={codeFormik.handleChange}
                        error={Boolean(codeFormik.errors.code)}
                        helperText={codeFormik.errors.code}
                    />
                    <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                        {loading ? 'Please wait...' : 'Verify code'}
                    </Button>
                    <Button onClick={resendCode} disabled={loading}>
                        Resend code
                    </Button>
                    <Button onClick={() => setStep('email')} disabled={loading}>
                        Use a different email
                    </Button>
                </Box>
            </>
        );
    } else if (step === 'password') {
        content = (
            <>
                <AuthHeading title="Choose a new password" subtitle="You'll be signed in right after." />
                <Box
                    key="password"
                    component="form"
                    onSubmit={passwordFormik.handleSubmit}
                    noValidate
                    sx={{ ...stack, ...staggerFields(active) }}
                >
                    <PasswordField
                        label="New password"
                        name="password"
                        autoComplete="new-password"
                        value={passwordFormik.values.password}
                        onChange={passwordFormik.handleChange}
                        error={Boolean(passwordFormik.errors.password)}
                        helperText={passwordFormik.errors.password}
                    />
                    <PasswordField
                        label="Confirm new password"
                        name="confirmPassword"
                        autoComplete="new-password"
                        value={passwordFormik.values.confirmPassword}
                        onChange={passwordFormik.handleChange}
                        error={Boolean(passwordFormik.errors.confirmPassword)}
                        helperText={passwordFormik.errors.confirmPassword}
                    />
                    <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                        {loading ? 'Please wait...' : 'Update password'}
                    </Button>
                </Box>
            </>
        );
    } else {
        content = (
            <>
                <AuthHeading
                    title="Forgot password?"
                    subtitle="Enter your email and we'll send you a code to reset it."
                />
                <Box
                    key="email"
                    component="form"
                    onSubmit={emailFormik.handleSubmit}
                    noValidate
                    sx={{ ...stack, ...staggerFields(active) }}
                >
                    <TextField
                        label="Email"
                        name="email"
                        type="text"
                        inputMode="email"
                        autoComplete="email"
                        fullWidth
                        value={emailFormik.values.email}
                        onChange={emailFormik.handleChange}
                        error={Boolean(emailFormik.errors.email)}
                        helperText={emailFormik.errors.email}
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
                    <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                        {loading ? 'Please wait...' : 'Send code'}
                    </Button>
                    <AuthSwitch prompt="Remembered it?" cta="Back to login" to="/login" />
                </Box>
            </>
        );
    }

    return content;
}
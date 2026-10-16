import { Link, useNavigate } from 'react-router-dom';
import { useUser, useReverification } from '@clerk/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, Card, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PasswordField from './PasswordField';
import { notifyError, notifySuccess } from '../../Utils/helpers';

const validationSchema = Yup.object({
    currentPassword: Yup.string().required('Current password is required'),
    newPassword: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .notOneOf([Yup.ref('currentPassword')], 'New password must be different')
        .required('New password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords do not match')
        .required('Please confirm your new password'),
});

export default function UpdatePassword() {
    const navigate = useNavigate();
    const { isLoaded, user } = useUser();
    const updatePassword = useReverification((params) => user.updatePassword(params));

    const formik = useFormik({
        initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: async (values, { setFieldError, resetForm }) => {
            try {
                await updatePassword({
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                    signOutOfOtherSessions: true,
                });
                resetForm();
                notifySuccess('Password updated');
                navigate('/me');
            } catch (err) {
                if (err?.code === 'reverification_cancelled') return;
                const e = err?.errors?.[0];
                const msg = e?.longMessage || e?.message || 'Could not update password';
                if (e?.meta?.paramName === 'current_password') setFieldError('currentPassword', msg);
                else if (e?.meta?.paramName === 'new_password') setFieldError('newPassword', msg);
                else notifyError(msg);
            }
        },
    });

    const noPassword = isLoaded && user && !user.passwordEnabled;
    const busy = !isLoaded || formik.isSubmitting;

    return (
        <form onSubmit={formik.handleSubmit} noValidate className="profile-page page-enter">
            <div className="edit-header">
                <Button component={Link} to="/me" startIcon={<ArrowBackRoundedIcon />} className="edit-back-btn" disabled={formik.isSubmitting}>
                    Back to profile
                </Button>
                <Typography variant="h5" component="h1" className="profile-name">
                    Change password
                </Typography>
            </div>

            {noPassword ? (
                <Card elevation={0} className="profile-panel">
                    <Typography component="h2" className="profile-panel-title">
                        Password
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        This account signs in with a social provider, so there's no password to change.
                    </Typography>
                </Card>
            ) : (
                <>
                    <Card elevation={0} className="profile-panel">
                        <Typography component="h2" className="profile-panel-title">
                            Current password
                        </Typography>
                        <div className="edit-stack">
                            <PasswordField
                                name="currentPassword"
                                label="Current password"
                                autoComplete="current-password"
                                value={formik.values.currentPassword}
                                onChange={formik.handleChange}
                                error={Boolean(formik.errors.currentPassword)}
                                helperText={formik.errors.currentPassword}
                            />
                        </div>
                    </Card>

                    <Card elevation={0} className="profile-panel">
                        <Typography component="h2" className="profile-panel-title">
                            New password
                        </Typography>
                        <div className="edit-stack">
                            <PasswordField
                                name="newPassword"
                                label="New password"
                                autoComplete="new-password"
                                value={formik.values.newPassword}
                                onChange={formik.handleChange}
                                error={Boolean(formik.errors.newPassword)}
                                helperText={formik.errors.newPassword || 'At least 8 characters'}
                            />
                            <PasswordField
                                name="confirmPassword"
                                label="Confirm new password"
                                autoComplete="new-password"
                                value={formik.values.confirmPassword}
                                onChange={formik.handleChange}
                                error={Boolean(formik.errors.confirmPassword)}
                                helperText={formik.errors.confirmPassword}
                            />
                        </div>
                    </Card>

                    <div className="edit-actions">
                        <Button component={Link} to="/me" disabled={formik.isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" disabled={busy} className="profile-edit-btn">
                            {formik.isSubmitting ? 'Saving...' : 'Update password'}
                        </Button>
                    </div>
                </>
            )}
        </form>
    );
}
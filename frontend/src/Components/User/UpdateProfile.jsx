import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Avatar, Button, Card, TextField, Typography } from '@mui/material';
import { clearErrors, updateMyProfile } from '../../actions/userActions';
import { UPDATE_PROFILE_RESET } from '../../constants/userConstants';
import { MAX_FILE_SIZE } from '../../constants/productConstants';
import { notifyError, notifySuccess } from '../../Utils/helpers';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Same limits as the User model on the backend
const validationSchema = Yup.object({
    name: Yup.string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name cannot exceed 50 characters')
        .required('Name is required'),
    phone: Yup.string()
        .trim()
        .matches(/^[0-9+\-\s()]{7,15}$/, { message: 'Enter a valid phone number', excludeEmptyString: true }),
    address: Yup.string().trim().max(200, 'Address is too long'),
    city: Yup.string().trim().max(60, 'City is too long'),
    postalCode: Yup.string()
        .trim()
        .matches(/^[A-Za-z0-9\s-]{3,10}$/, { message: 'Enter a valid postal code', excludeEmptyString: true }),
    country: Yup.string().trim().max(60, 'Country is too long'),
});

export default function UpdateProfile() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { loading, error } = useSelector((state) => state.user);

    const [avatar, setAvatar] = useState(null); // a newly picked photo, as a data URL
    const [avatarError, setAvatarError] = useState('');
    const saved = user.shippingAddress || {};

    useEffect(() => {
        if (error) {
            notifyError(error);
            dispatch(clearErrors());
        }
    }, [error, dispatch]);

    const formik = useFormik({
        initialValues: {
            name: user.name || '',
            phone: user.phone || '',
            address: saved.address || '',
            city: saved.city || '',
            postalCode: saved.postalCode || '',
            country: saved.country || '',
        },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: async (values) => {
            const payload = {
                name: values.name.trim(),
                phone: values.phone.trim(),
                shippingAddress: {
                    address: values.address.trim(),
                    city: values.city.trim(),
                    postalCode: values.postalCode.trim(),
                    country: values.country.trim(),
                },
            };
            if (avatar) payload.avatar = avatar;

            const isSaved = await dispatch(updateMyProfile(payload));
            if (isSaved) {
                notifySuccess('Profile updated');
                dispatch({ type: UPDATE_PROFILE_RESET });
                navigate('/me');
            }
        },
    });

    const handleAvatar = (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            setAvatarError('Only JPG, PNG, or WebP images are allowed');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setAvatarError('Photo must be 2 MB or smaller');
            return;
        }

        setAvatarError('');
        const reader = new FileReader();
        reader.onload = () => setAvatar(reader.result);
        reader.readAsDataURL(file);
    };

    const field = (name, label, extra = {}) => (
        <TextField
            label={label}
            name={name}
            fullWidth
            value={formik.values[name]}
            onChange={formik.handleChange}
            error={Boolean(formik.errors[name])}
            helperText={formik.errors[name]}
            {...extra}
        />
    );

    return (
        <div className="auth-wrapper">
            <Card className="auth-card">
                <Typography variant="h5" component="h1" className="auth-title">
                    Edit profile
                </Typography>

                <form onSubmit={formik.handleSubmit} noValidate className="form-stack">
                    <div className="avatar-upload">
                        <Avatar
                            src={avatar || user.avatar?.url || undefined}
                            alt={user.name}
                            sx={{ width: 80, height: 80 }}
                        >
                            {user.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <div>
                            <Button variant="outlined" component="label" size="small">
                                Change photo
                                <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatar} />
                            </Button>
                            {avatarError && (
                                <Typography color="error" variant="body2">
                                    {avatarError}
                                </Typography>
                            )}
                        </div>
                    </div>

                    {field('name', 'Full name', { autoComplete: 'name' })}
                    <TextField
                        label="Email"
                        fullWidth
                        value={user.email}
                        disabled
                        helperText="Your email can't be changed here"
                    />
                    {field('phone', 'Phone number', { autoComplete: 'tel', inputMode: 'tel' })}

                    <Typography variant="subtitle2">Shipping address</Typography>
                    {field('address', 'Address', { autoComplete: 'street-address' })}
                    {field('city', 'City', { autoComplete: 'address-level2' })}
                    {field('postalCode', 'Postal code', { autoComplete: 'postal-code' })}
                    {field('country', 'Country', { autoComplete: 'country-name' })}

                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? 'Saving...' : 'Save changes'}
                    </Button>
                    <Button component={Link} to="/me" disabled={loading}>
                        Cancel
                    </Button>
                </form>
            </Card>
        </div>
    );
}
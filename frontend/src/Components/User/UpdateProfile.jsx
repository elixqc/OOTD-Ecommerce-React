import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Avatar, Button, Card, TextField, Typography } from '@mui/material';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { clearErrors, updateMyProfile } from '../../actions/userActions';
import { UPDATE_PROFILE_RESET } from '../../constants/userConstants';
import { MAX_FILE_SIZE } from '../../constants/productConstants';
import { notifyError, notifySuccess } from '../../Utils/helpers';
import LocationFields from '../Common/LocationFields';

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
    region: Yup.string().trim().max(80, 'Region is too long'),
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
            region: saved.region || '',
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
                    region: values.region.trim(),
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
        <form onSubmit={formik.handleSubmit} noValidate className="profile-page page-enter">
            <div className="edit-header">
                <Button component={Link} to="/me" startIcon={<ArrowBackRoundedIcon />} className="edit-back-btn" disabled={loading}>
                    Back to profile
                </Button>
                <Typography variant="h5" component="h1" className="profile-name">
                    Edit profile
                </Typography>
            </div>

            <Card elevation={0} className="profile-hero">
                <div className="profile-banner" />
                <div className="profile-hero-body">
                    <Avatar src={avatar || user.avatar?.url || undefined} alt={user.name} className="profile-avatar">
                        {user.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <div className="profile-hero-info">
                        <Typography component="h2" className="edit-photo-title">
                            Profile photo
                        </Typography>
                        <Typography variant="body2" color={avatarError ? 'error' : 'text.secondary'}>
                            {avatarError || 'JPG, PNG or WebP, up to 2 MB'}
                        </Typography>
                    </div>
                    <Button variant="outlined" component="label" startIcon={<PhotoCameraOutlinedIcon />} className="profile-edit-btn">
                        Change photo
                        <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatar} />
                    </Button>
                </div>
            </Card>

            <Card elevation={0} className="profile-panel">
                <Typography component="h2" className="profile-panel-title">
                    Personal information
                </Typography>
                <div className="edit-grid">
                    {field('name', 'Full name', { autoComplete: 'name' })}
                    <TextField
                        label="Email"
                        fullWidth
                        value={user.email}
                        disabled
                        helperText="Your email can't be changed here"
                    />
                    {field('phone', 'Phone number', { autoComplete: 'tel', inputMode: 'tel' })}
                </div>
            </Card>

            <Card elevation={0} className="profile-panel">
                <Typography component="h2" className="profile-panel-title">
                    Shipping address
                </Typography>
                <div className="edit-stack">
                    <LocationFields formik={formik} rowClassName="edit-grid" />
                    {field('address', 'Address', { autoComplete: 'street-address' })}
                    <div className="edit-grid">{field('postalCode', 'Postal code', { autoComplete: 'postal-code' })}</div>
                </div>
            </Card>

            <div className="edit-actions">
                <Button component={Link} to="/me" disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={loading} className="profile-edit-btn">
                    {loading ? 'Saving...' : 'Save changes'}
                </Button>
            </div>
        </form>
    );
}
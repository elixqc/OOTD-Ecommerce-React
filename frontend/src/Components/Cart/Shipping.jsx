import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, Card, TextField, Typography } from '@mui/material';
import CheckoutSteps from './CheckoutSteps';
import { saveShippingInfo } from '../../actions/cartActions';

const validationSchema = Yup.object({
    address: Yup.string().trim().min(5, 'Enter your full address').max(200, 'Address is too long').required('Address is required'),
    city: Yup.string().trim().max(60, 'City is too long').required('City is required'),
    phoneNo: Yup.string()
        .trim()
        .matches(/^[0-9+\-\s()]{7,15}$/, 'Enter a valid phone number')
        .required('Phone number is required'),
    postalCode: Yup.string()
        .trim()
        .matches(/^[A-Za-z0-9\s-]{3,10}$/, 'Enter a valid postal code')
        .required('Postal code is required'),
    country: Yup.string().trim().max(60, 'Country is too long').required('Country is required'),
});

export default function Shipping() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { cartItems, shippingInfo } = useSelector((state) => state.cart);
    const { user } = useSelector((state) => state.auth);

    // Nothing to check out
    useEffect(() => {
        if (cartItems.length === 0) navigate('/cart', { replace: true });
    }, [cartItems.length, navigate]);

    // Use the last address typed here, otherwise the one saved in the profile
    const saved = user?.shippingAddress || {};
    const formik = useFormik({
        initialValues: {
            address: shippingInfo?.address ?? saved.address ?? '',
            city: shippingInfo?.city ?? saved.city ?? '',
            phoneNo: shippingInfo?.phoneNo ?? user?.phone ?? '',
            postalCode: shippingInfo?.postalCode ?? saved.postalCode ?? '',
            country: shippingInfo?.country ?? (saved.country || 'Philippines'),
        },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: (values) => {
            const cleaned = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]));
            dispatch(saveShippingInfo(cleaned));
            navigate('/confirm');
        },
    });

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
        <>
            <CheckoutSteps activeStep={0} />
            <div className="auth-wrapper">
                <Card className="auth-card">
                    <Typography variant="h5" component="h1" className="auth-title">
                        Shipping info
                    </Typography>

                    <form onSubmit={formik.handleSubmit} noValidate className="form-stack">
                        {field('address', 'Address', { autoComplete: 'street-address' })}
                        {field('city', 'City', { autoComplete: 'address-level2' })}
                        {field('phoneNo', 'Phone number', { autoComplete: 'tel', inputMode: 'tel' })}
                        {field('postalCode', 'Postal code', { autoComplete: 'postal-code' })}
                        {field('country', 'Country', { autoComplete: 'country-name' })}
                        <Button type="submit" variant="contained">
                            Continue
                        </Button>
                    </form>
                </Card>
            </div>
        </>
    );
}

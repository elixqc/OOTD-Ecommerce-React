// TTL · Transactions + U1-B · Validation — shipping address step.
// Formik + Yup validated address form; on submit it saves shipping info to the cart and moves to review.
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, TextField } from '@mui/material';
import { saveShippingInfo } from '../../actions/cartActions';
import LocationFields from '../Common/LocationFields';

const validationSchema = Yup.object({
    address: Yup.string()
        .trim()
        .min(5, 'Enter your full address')
        .max(200, 'Address is too long')
        .required('Address is required'),
    region: Yup.string().trim().max(80, 'Region is too long').required('Region is required'),
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

    // Start from the address typed earlier in this session (e.g. after clicking
    // "Change" on the review page). Otherwise use the profile's address and phone,
    // but only when both are saved. If not, the form starts empty.
    const saved = user?.shippingAddress || {};
    const useProfile = Boolean(saved.address && user?.phone);
    const start = shippingInfo || (useProfile ? { ...saved, phoneNo: user.phone } : {});
    const formik = useFormik({
        initialValues: {
            country: start.country ?? '',
            region: start.region ?? '',
            city: start.city ?? '',
            address: start.address ?? '',
            postalCode: start.postalCode ?? '',
            phoneNo: start.phoneNo ?? '',
        },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: (values) => {
            const cleaned = Object.fromEntries(
                Object.entries(values).map(([k, v]) => [k, v.trim()]),
            );
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
            <section className="checkout-section">
                <h2 className="checkout-heading">Contact</h2>
                <TextField
                    label="Email"
                    value={user?.email || ''}
                    fullWidth
                    disabled
                    helperText="Your receipt and order updates are sent to this email"
                />
            </section>

            <form onSubmit={formik.handleSubmit} noValidate>
                <section className="checkout-section">
                    <h2 className="checkout-heading">Delivery</h2>
                    <div
                        className="checkout-fields"
                        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                    >
                        <LocationFields formik={formik} />
                        {field('address', 'Address', { autoComplete: 'street-address' })}
                        <div className="checkout-row">
                            {field('postalCode', 'Postal code', { autoComplete: 'postal-code' })}
                            {field('phoneNo', 'Phone', { autoComplete: 'tel', inputMode: 'tel' })}
                        </div>
                    </div>
                </section>

                <div className="checkout-actions">
                    <Link to="/cart" className="checkout-back">
                        ‹ Return to cart
                    </Link>
                    <Button type="submit" variant="contained" size="large">
                        Continue to review
                    </Button>
                </div>
            </form>
        </>
    );
}

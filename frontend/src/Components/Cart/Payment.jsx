import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, FormControl, FormControlLabel, Radio, RadioGroup, TextField, Typography } from '@mui/material';
import CheckoutSteps from './CheckoutSteps';
import { clearCart } from '../../actions/cartActions';
import { createOrder } from '../../actions/orderActions';
import { clearErrors } from '../../actions/userActions';
import { notifyError, notifySuccess, peso } from '../../Utils/helpers';

const COD = 'Cash on Delivery';
const CARD = 'Credit/Debit Card';

const isFutureExpiry = (value) => {
    const match = /^(\d{2})\/(\d{2})$/.exec(value || '');
    if (!match) return false;
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if (month < 1 || month > 12) return false;
    // A card is valid through the end of its expiry month
    return new Date(year, month, 1) > new Date();
};

const cardSchema = Yup.object({
    cardName: Yup.string().trim().min(2, 'Enter the name on the card').required('Name on card is required'),
    cardNumber: Yup.string()
        .required('Card number is required')
        .test('digits', 'Enter a 16-digit card number', (v) => /^\d{16}$/.test((v || '').replace(/\s/g, ''))),
    expiry: Yup.string()
        .required('Expiry date is required')
        .test('expiry', 'Enter a future date as MM/YY', isFutureExpiry),
    cvc: Yup.string()
        .required('CVC is required')
        .matches(/^\d{3,4}$/, 'Enter the 3 or 4 digit CVC'),
});

export default function Payment() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { cartItems, shippingInfo } = useSelector((state) => state.cart);
    const { loading, error } = useSelector((state) => state.newOrder);
    const [method, setMethod] = useState(COD);
    const orderPlaced = useRef(false); // stops the "empty cart" redirect once the order goes through

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    useEffect(() => {
        if (orderPlaced.current) return;
        if (cartItems.length === 0) navigate('/cart', { replace: true });
        else if (!shippingInfo) navigate('/shipping', { replace: true });
    }, [cartItems.length, shippingInfo, navigate]);

    useEffect(() => {
        if (error) {
            notifyError(error);
            dispatch(clearErrors());
        }
    }, [error, dispatch]);

    const placeOrder = async () => {
        // Card details are only checked here, never sent: there's no real payment gateway.
        // The server reads names and prices from the database; it only needs these.
        const order = await dispatch(
            createOrder({
                orderItems: cartItems.map(({ product, size, color, quantity }) => ({ product, size, color, quantity })),
                shippingInfo,
                paymentMethod: method,
            })
        );
        if (!order) return;

        orderPlaced.current = true;
        notifySuccess('Order placed successfully!');
        dispatch(clearCart());
        navigate('/order/success', { replace: true });
    };

    const formik = useFormik({
        initialValues: { cardName: '', cardNumber: '', expiry: '', cvc: '' },
        validationSchema: method === CARD ? cardSchema : undefined,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: placeOrder,
    });

    const field = (name, label, extra = {}) => ({
        name,
        label,
        fullWidth: true,
        value: formik.values[name],
        onChange: formik.handleChange,
        error: Boolean(formik.errors[name]),
        helperText: formik.errors[name],
        ...extra,
    });

    if (!shippingInfo || cartItems.length === 0) return null;

    return (
        <>
            <CheckoutSteps activeStep={2} />
            <Typography variant="h4" component="h1" className="page-title">
                Payment
            </Typography>

            <div className="cart-layout">
                <form onSubmit={formik.handleSubmit} noValidate className="order-card form-stack">
                    <FormControl>
                        <Typography variant="h6">Payment method</Typography>
                        <RadioGroup
                            value={method}
                            onChange={(e) => {
                                setMethod(e.target.value);
                                formik.setErrors({});
                            }}
                        >
                            <FormControlLabel value={COD} control={<Radio />} label="Cash on Delivery" />
                            <FormControlLabel value={CARD} control={<Radio />} label="Credit / debit card" />
                        </RadioGroup>
                    </FormControl>

                    {method === COD ? (
                        <Typography variant="body2" color="text.secondary">
                            Pay in cash when your order arrives. Please prepare the exact amount.
                        </Typography>
                    ) : (
                        <>
                            <Typography variant="body2" color="text.secondary">
                                Demo only: no real payment is made, and your card details are not stored or sent anywhere.
                            </Typography>
                            <TextField {...field('cardName', 'Name on card', { autoComplete: 'cc-name' })} />
                            <TextField
                                {...field('cardNumber', 'Card number', {
                                    autoComplete: 'cc-number',
                                    placeholder: '1234 5678 9012 3456',
                                    slotProps: { htmlInput: { inputMode: 'numeric', maxLength: 19 } },
                                })}
                            />
                            <div className="form-grid">
                                <TextField
                                    {...field('expiry', 'Expiry (MM/YY)', {
                                        autoComplete: 'cc-exp',
                                        placeholder: 'MM/YY',
                                        slotProps: { htmlInput: { maxLength: 5 } },
                                    })}
                                />
                                <TextField
                                    {...field('cvc', 'CVC', {
                                        autoComplete: 'cc-csc',
                                        slotProps: { htmlInput: { inputMode: 'numeric', maxLength: 4 } },
                                    })}
                                />
                            </div>
                        </>
                    )}

                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? 'Placing order...' : `Place order · ${peso(totalPrice)}`}
                    </Button>
                    <Button component={Link} to="/confirm">
                        Back
                    </Button>
                </form>
            </div>
        </>
    );
}

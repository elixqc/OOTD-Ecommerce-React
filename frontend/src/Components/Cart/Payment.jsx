import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, Radio, TextField } from '@mui/material';
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
    const { user } = useSelector((state) => state.auth);
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

    const chooseMethod = (value) => {
        setMethod(value);
        formik.setErrors({});
    };

    if (!shippingInfo || cartItems.length === 0) return null;

    return (
        <>
            <section className="review-box">
                <div className="review-row">
                    <span className="review-label">Contact</span>
                    <span className="review-value">{user?.email}</span>
                </div>
                <div className="review-row">
                    <span className="review-label">Ship to</span>
                    <span className="review-value">
                        {shippingInfo.address}, {shippingInfo.city} {shippingInfo.postalCode}, {shippingInfo.country}
                    </span>
                    <Link to="/shipping" className="review-change">
                        Change
                    </Link>
                </div>
                <div className="review-row">
                    <span className="review-label">Method</span>
                    <span className="review-value">Standard delivery · Free</span>
                </div>
            </section>

            <form onSubmit={formik.handleSubmit} noValidate>
                <section className="checkout-section">
                    <h2 className="checkout-heading">Payment</h2>

                    <div className="pay-options">
                        <label className={method === COD ? 'pay-option selected' : 'pay-option'}>
                            <Radio name="method" value={COD} checked={method === COD} onChange={() => chooseMethod(COD)} />
                            <span>Cash on Delivery</span>
                        </label>
                        {method === COD && (
                            <div className="pay-panel">
                                Pay in cash when your order arrives. Please prepare the exact amount.
                            </div>
                        )}

                        <label className={method === CARD ? 'pay-option selected' : 'pay-option'}>
                            <Radio name="method" value={CARD} checked={method === CARD} onChange={() => chooseMethod(CARD)} />
                            <span>Credit / debit card</span>
                        </label>
                        {method === CARD && (
                            <div className="pay-panel">
                                <span>
                                    Demo only: no real payment is made, and your card details are not stored or sent anywhere.
                                </span>
                                <TextField {...field('cardName', 'Name on card', { autoComplete: 'cc-name' })} />
                                <TextField
                                    {...field('cardNumber', 'Card number', {
                                        autoComplete: 'cc-number',
                                        placeholder: '1234 5678 9012 3456',
                                        slotProps: { htmlInput: { inputMode: 'numeric', maxLength: 19 } },
                                    })}
                                />
                                <div className="checkout-row">
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
                            </div>
                        )}
                    </div>
                </section>

                <div className="checkout-actions">
                    <Link to="/confirm" className="checkout-back">
                        ‹ Return to review
                    </Link>
                    <Button type="submit" variant="contained" size="large" disabled={loading}>
                        {loading ? 'Placing order...' : `Place order · ${peso(totalPrice)}`}
                    </Button>
                </div>
            </form>
        </>
    );
}
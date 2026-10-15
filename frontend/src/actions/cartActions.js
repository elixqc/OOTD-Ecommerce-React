import { getColorImageUrl } from '../Utils/productImages';
import { ADD_TO_CART, REMOVE_FROM_CART, CLEAR_CART, SAVE_SHIPPING_INFO } from '../constants/cartConstants';

// Guests use 'cartItems'. A logged-in user gets their own key.
const cartStorageKey = (getState) => {
    const user = getState().auth.user;
    return user ? `cartItems:${user._id}` : 'cartItems';
};

const saveCart = (getState) => {
    try {
        localStorage.setItem(cartStorageKey(getState), JSON.stringify(getState().cart.cartItems));
    } catch {
        // Storage is full or blocked: the cart still works until the page is closed
    }
};

// One cart line per product + size + color
export const getCartKey = (productId, size, color) => `${productId}|${size}|${color}`;

// Returns an error message, or null when the item was added
export const addToCart = (product, size, color, quantity) => (dispatch, getState) => {
    const variant = product.variants.find((v) => v.size === size && v.color === color);
    if (!variant || variant.stock === 0) return 'This size and color is out of stock';

    const key = getCartKey(product._id, size, color);
    const existing = getState().cart.cartItems.find((i) => i.key === key);
    const newQuantity = (existing ? existing.quantity : 0) + quantity;

    if (newQuantity > variant.stock) {
        return existing
            ? `Only ${variant.stock} available, and you already have ${existing.quantity} in your cart`
            : `Only ${variant.stock} available`;
    }

    dispatch({
        type: ADD_TO_CART,
        payload: {
            key,
            product: product._id,
            name: product.name,
            image: getColorImageUrl(product, color),
            price: product.price,
            size,
            color,
            quantity: newQuantity,
            stock: variant.stock,
        },
    });
    saveCart(getState);
    return null;
};

export const updateCartQuantity = (key, quantity) => (dispatch, getState) => {
    const item = getState().cart.cartItems.find((i) => i.key === key);
    if (!item) return;

    const safeQuantity = Math.min(Math.max(quantity, 1), item.stock);
    dispatch({ type: ADD_TO_CART, payload: { ...item, quantity: safeQuantity } });
    saveCart(getState);
};

export const removeFromCart = (key) => (dispatch, getState) => {
    dispatch({ type: REMOVE_FROM_CART, payload: key });
    saveCart(getState);
};

// Called after an order is placed
export const clearCart = () => (dispatch, getState) => {
    dispatch({ type: CLEAR_CART });
    saveCart(getState);
};

// Kept in memory only (not in the browser), so it can't show up for a different user
export const saveShippingInfo = (shippingInfo) => (dispatch) => {
    dispatch({ type: SAVE_SHIPPING_INFO, payload: shippingInfo });
};

// Called after login: merges the user's saved cart with the guest cart
export const loadUserCart = (user) => (dispatch, getState) => {
    try {
        const key = `cartItems:${user._id}`;
        const saved = JSON.parse(localStorage.getItem(key));
        const merged = Array.isArray(saved) ? [...saved] : [];

        getState().cart.cartItems.forEach((guestItem) => {
            const i = merged.findIndex((m) => m.key === guestItem.key);
            if (i === -1) {
                merged.push(guestItem);
            } else {
                const quantity = Math.min(merged[i].quantity + guestItem.quantity, merged[i].stock);
                merged[i] = { ...merged[i], quantity };
            }
        });

        merged.forEach((item) => dispatch({ type: ADD_TO_CART, payload: item }));
        localStorage.setItem(key, JSON.stringify(merged));
        localStorage.removeItem('cartItems'); // the guest cart now lives in the user's cart
    } catch {
        // Storage blocked: the cart just stays as it is
    }
};
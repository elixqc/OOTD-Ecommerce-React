import { ADD_TO_CART, REMOVE_FROM_CART, CLEAR_CART, SAVE_SHIPPING_INFO } from '../constants/cartConstants';

const saveCart = (getState) => {
    try {
        localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems));
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
            image: product.images[0]?.url,
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

export const saveShippingInfo = (shippingInfo) => (dispatch) => {
    dispatch({ type: SAVE_SHIPPING_INFO, payload: shippingInfo });
    try {
        localStorage.setItem('shippingInfo', JSON.stringify(shippingInfo));
    } catch {
        // Storage is blocked: the address is still used for this order
    }
};

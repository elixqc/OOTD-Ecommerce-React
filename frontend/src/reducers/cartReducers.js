import { ADD_TO_CART, REMOVE_FROM_CART, CLEAR_CART, SAVE_SHIPPING_INFO } from '../constants/cartConstants';

export const cartReducer = (state = { cartItems: [], shippingInfo: null }, action) => {
    switch (action.type) {
        case ADD_TO_CART: {
            const item = action.payload;
            const exists = state.cartItems.some((i) => i.key === item.key);
            return {
                ...state,
                cartItems: exists
                    ? state.cartItems.map((i) => (i.key === item.key ? item : i))
                    : [...state.cartItems, item],
            };
        }

        case REMOVE_FROM_CART:
            return { ...state, cartItems: state.cartItems.filter((i) => i.key !== action.payload) };

        case CLEAR_CART:
            return { ...state, cartItems: [] };

        case SAVE_SHIPPING_INFO:
            return { ...state, shippingInfo: action.payload };

        default:
            return state;
    }
};
import { ADD_TO_CART, REMOVE_FROM_CART } from '../constants/cartConstants';

export const cartReducer = (state = { cartItems: [] }, action) => {
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

        default:
            return state;
    }
};
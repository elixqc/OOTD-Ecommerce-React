import { combineReducers, applyMiddleware, legacy_createStore as createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { authReducer } from './reducers/userReducers';
import {
    adminProductsReducer,
    productDetailsReducer,
    newProductReducer,
    productReducer,
    catalogReducer,
    relatedProductsReducer,
} from './reducers/productReducers';
import { cartReducer } from './reducers/cartReducers';

const reducer = combineReducers({
    auth: authReducer,
    adminProducts: adminProductsReducer,
    productDetails: productDetailsReducer,
    newProduct: newProductReducer,
    product: productReducer,
    catalog: catalogReducer,
    relatedProducts: relatedProductsReducer,
    cart: cartReducer,
});

// Restore the saved cart, ignoring anything that doesn't look like a cart line
const loadCartItems = () => {
    try {
        const items = JSON.parse(localStorage.getItem('cartItems'));
        if (!Array.isArray(items)) return [];
        return items.filter(
            (i) => i && typeof i.key === 'string' && Number.isFinite(i.price) && Number.isFinite(i.quantity)
        );
    } catch {
        return [];
    }
};

const initialState = { cart: { cartItems: loadCartItems() } };

const store = createStore(reducer, initialState, applyMiddleware(thunk));

export default store;
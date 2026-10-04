import { combineReducers, applyMiddleware, legacy_createStore as createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { authReducer, userReducer } from './reducers/userReducers';
import { allUsersReducer, userDetailsReducer, adminUserReducer } from './reducers/userReducers';
import { forgotPasswordReducer } from './reducers/userReducers';
import {
    adminProductsReducer,
    productDetailsReducer,
    newProductReducer,
    productReducer,
    catalogReducer,
    relatedProductsReducer,
} from './reducers/productReducers';
import { cartReducer } from './reducers/cartReducers';
import { productReviewsReducer, reviewStatusReducer, adminReviewsReducer, myReviewsReducer } from './reducers/reviewReducers';
import {
    newOrderReducer,
    myOrdersReducer,
    orderDetailsReducer,
    adminOrdersReducer,
    orderReducer,
} from './reducers/orderReducers';

const reducer = combineReducers({
    auth: authReducer,
    forgotPassword: forgotPasswordReducer,
    user: userReducer,
    allUsers: allUsersReducer,
    userDetails: userDetailsReducer,
    adminUser: adminUserReducer,
    adminProducts: adminProductsReducer,
    productDetails: productDetailsReducer,
    newProduct: newProductReducer,
    product: productReducer,
    catalog: catalogReducer,
    relatedProducts: relatedProductsReducer,
    cart: cartReducer,
    newOrder: newOrderReducer,
    myOrders: myOrdersReducer,
    orderDetails: orderDetailsReducer,
    adminOrders: adminOrdersReducer,
    order: orderReducer,
    productReviews: productReviewsReducer,
    reviewStatus: reviewStatusReducer,
    adminReviews: adminReviewsReducer,
    myReviews: myReviewsReducer,
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

// Restore the saved shipping address, or null if there isn't a usable one
const loadShippingInfo = () => {
    try {
        const info = JSON.parse(localStorage.getItem('shippingInfo'));
        const fields = ['address', 'city', 'phoneNo', 'postalCode', 'country'];
        return info && fields.every((f) => typeof info[f] === 'string') ? info : null;
    } catch {
        return null;
    }
};

const initialState = { cart: { cartItems: loadCartItems(), shippingInfo: loadShippingInfo() } };

const store = createStore(reducer, initialState, applyMiddleware(thunk));

export default store;
// CORE · Redux store — combines every reducer and restores the saved cart.
// Provides global state (auth, catalog, cart, orders, reviews, wishlist) read by all components.
import { combineReducers, applyMiddleware, legacy_createStore as createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { authReducer, userReducer } from './reducers/userReducers';
import {
    allUsersReducer,
    userDetailsReducer,
    adminUserReducer,
    updatePasswordReducer,
} from './reducers/userReducers';
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
import { wishlistReducer } from './reducers/wishlistReducers';
import {
    productReviewsReducer,
    reviewStatusReducer,
    adminReviewsReducer,
    myReviewsReducer,
    myReviewListReducer,
} from './reducers/reviewReducers';
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
    updatePassword: updatePasswordReducer,
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
    wishlist: wishlistReducer,
    myReviewList: myReviewListReducer,
});

// Restore the saved cart, ignoring anything that doesn't look like a cart line
const loadCartItems = () => {
    try {
        const items = JSON.parse(localStorage.getItem('cartItems'));
        if (!Array.isArray(items)) return [];
        return items.filter(
            (i) =>
                i &&
                typeof i.key === 'string' &&
                Number.isFinite(i.price) &&
                Number.isFinite(i.quantity),
        );
    } catch {
        return [];
    }
};

// An address remembered in this browser by older versions must not fill in
// checkout for whoever uses it next
try {
    localStorage.removeItem('shippingInfo');
} catch {
    // Storage is blocked: nothing to remove
}

const initialState = { cart: { cartItems: loadCartItems(), shippingInfo: null } };

const store = createStore(reducer, initialState, applyMiddleware(thunk));

export default store;

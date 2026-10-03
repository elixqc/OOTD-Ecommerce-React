import { combineReducers, applyMiddleware, legacy_createStore as createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { authReducer } from './reducers/userReducers';
import {
    adminProductsReducer,
    productDetailsReducer,
    newProductReducer,
    productReducer,
    catalogReducer,
} from './reducers/productReducers';

const reducer = combineReducers({
    auth: authReducer,
    adminProducts: adminProductsReducer,
    productDetails: productDetailsReducer,
    newProduct: newProductReducer,
    product: productReducer,
    catalog: catalogReducer,
});

const store = createStore(reducer, applyMiddleware(thunk));

export default store;
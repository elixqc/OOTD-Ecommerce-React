import { combineReducers, applyMiddleware, legacy_createStore as createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { authReducer } from './reducers/userReducers';

const reducer = combineReducers({
    auth: authReducer,
});

const store = createStore(reducer, applyMiddleware(thunk));

export default store;
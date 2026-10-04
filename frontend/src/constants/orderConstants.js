export const NEW_ORDER_REQUEST = 'NEW_ORDER_REQUEST';
export const NEW_ORDER_SUCCESS = 'NEW_ORDER_SUCCESS';
export const NEW_ORDER_FAIL = 'NEW_ORDER_FAIL';
export const NEW_ORDER_RESET = 'NEW_ORDER_RESET';

export const MY_ORDERS_REQUEST = 'MY_ORDERS_REQUEST';
export const MY_ORDERS_SUCCESS = 'MY_ORDERS_SUCCESS';
export const MY_ORDERS_FAIL = 'MY_ORDERS_FAIL';

export const ORDER_DETAILS_REQUEST = 'ORDER_DETAILS_REQUEST';
export const ORDER_DETAILS_SUCCESS = 'ORDER_DETAILS_SUCCESS';
export const ORDER_DETAILS_FAIL = 'ORDER_DETAILS_FAIL';

export const ADMIN_ORDERS_REQUEST = 'ADMIN_ORDERS_REQUEST';
export const ADMIN_ORDERS_SUCCESS = 'ADMIN_ORDERS_SUCCESS';
export const ADMIN_ORDERS_FAIL = 'ADMIN_ORDERS_FAIL';

export const UPDATE_ORDER_REQUEST = 'UPDATE_ORDER_REQUEST';
export const UPDATE_ORDER_SUCCESS = 'UPDATE_ORDER_SUCCESS';
export const UPDATE_ORDER_FAIL = 'UPDATE_ORDER_FAIL';
export const UPDATE_ORDER_RESET = 'UPDATE_ORDER_RESET';

export const DELETE_ORDER_REQUEST = 'DELETE_ORDER_REQUEST';
export const DELETE_ORDER_SUCCESS = 'DELETE_ORDER_SUCCESS';
export const DELETE_ORDER_FAIL = 'DELETE_ORDER_FAIL';
export const DELETE_ORDER_RESET = 'DELETE_ORDER_RESET';

// These must match backend/utils/constants.js and NEXT_STATUSES in backend/controllers/order.js
export const ORDER_STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
export const NEXT_ORDER_STATUSES = {
    Processing: ['Shipped', 'Cancelled'],
    Shipped: ['Delivered', 'Cancelled'],
    Delivered: [],
    Cancelled: [],
};

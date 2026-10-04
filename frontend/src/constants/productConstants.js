export const ADMIN_PRODUCTS_REQUEST = 'ADMIN_PRODUCTS_REQUEST';
export const ADMIN_PRODUCTS_SUCCESS = 'ADMIN_PRODUCTS_SUCCESS';
export const ADMIN_PRODUCTS_FAIL = 'ADMIN_PRODUCTS_FAIL';

export const PRODUCT_DETAILS_REQUEST = 'PRODUCT_DETAILS_REQUEST';
export const PRODUCT_DETAILS_SUCCESS = 'PRODUCT_DETAILS_SUCCESS';
export const PRODUCT_DETAILS_FAIL = 'PRODUCT_DETAILS_FAIL';

export const NEW_PRODUCT_REQUEST = 'NEW_PRODUCT_REQUEST';
export const NEW_PRODUCT_SUCCESS = 'NEW_PRODUCT_SUCCESS';
export const NEW_PRODUCT_FAIL = 'NEW_PRODUCT_FAIL';
export const NEW_PRODUCT_RESET = 'NEW_PRODUCT_RESET';

export const UPDATE_PRODUCT_REQUEST = 'UPDATE_PRODUCT_REQUEST';
export const UPDATE_PRODUCT_SUCCESS = 'UPDATE_PRODUCT_SUCCESS';
export const UPDATE_PRODUCT_FAIL = 'UPDATE_PRODUCT_FAIL';
export const UPDATE_PRODUCT_RESET = 'UPDATE_PRODUCT_RESET';

export const DELETE_PRODUCT_REQUEST = 'DELETE_PRODUCT_REQUEST';
export const DELETE_PRODUCT_SUCCESS = 'DELETE_PRODUCT_SUCCESS';
export const DELETE_PRODUCT_FAIL = 'DELETE_PRODUCT_FAIL';
export const DELETE_PRODUCT_RESET = 'DELETE_PRODUCT_RESET';

// Public catalog (homepage)
export const PRODUCTS_REQUEST = 'PRODUCTS_REQUEST';
export const PRODUCTS_SUCCESS = 'PRODUCTS_SUCCESS';
export const PRODUCTS_FAIL = 'PRODUCTS_FAIL';

// "You May Also Like"
export const RELATED_PRODUCTS_REQUEST = 'RELATED_PRODUCTS_REQUEST';
export const RELATED_PRODUCTS_SUCCESS = 'RELATED_PRODUCTS_SUCCESS';
export const RELATED_PRODUCTS_FAIL = 'RELATED_PRODUCTS_FAIL';

// These must match backend/utils/constants.js
export const CATEGORIES = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'];
export const GENDERS = ['Men', 'Women', 'Unisex'];

export const MAX_IMAGES_PER_COLOR = 5; // must match backend/utils/constants.js
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB picked from the device (it is resized before upload)
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
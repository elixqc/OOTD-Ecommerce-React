import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { listenToAuthChanges } from './actions/userActions';
import CustomerLayout from './Components/Layout/CustomerLayout';
import AdminLayout from './Components/Admin/AdminLayout';
import ProtectedRoute from './Components/Route/ProtectedRoute';
import MetaData from './Components/Layout/MetaData';
import CheckoutLayout from './Components/Cart/CheckoutLayout';
import Payment from './Components/Cart/Payment';
import Home from './Components/Home';
import Login from './Components/User/Login';
import Register from './Components/User/Register';
import ForgotPassword from './Components/User/ForgotPassword';
import Profile from './Components/User/Profile';
import UpdateProfile from './Components/User/UpdateProfile';
import UpdatePassword from './Components/User/UpdatePassword';
import ProductDetails from './Components/Product/ProductDetails';
import Cart from './Components/Cart/Cart';
import Shipping from './Components/Cart/Shipping';
import ConfirmOrder from './Components/Cart/ConfirmOrder';
import OrderSuccess from './Components/Cart/OrderSuccess';
import ListOrders from './Components/Order/ListOrders';
import OrderDetails from './Components/Order/OrderDetails';
import Dashboard from './Components/Admin/Dashboard';
import ProductsList from './Components/Admin/ProductsList';
import NewProduct from './Components/Admin/NewProduct';
import UpdateProduct from './Components/Admin/UpdateProduct';
import OrdersList from './Components/Admin/OrdersList';
import ProcessOrder from './Components/Admin/ProcessOrder';
import ReviewsList from './Components/Admin/ReviewsList';
import UsersList from './Components/Admin/UsersList';
import UpdateUser from './Components/Admin/UpdateUser';

function App() {
    const dispatch = useDispatch();

    // Restore the login session when the app opens
    useEffect(() => {
        const unsubscribe = dispatch(listenToAuthChanges());
        return unsubscribe;
    }, [dispatch]);

    return (
        <Routes>
            <Route element={<CustomerLayout />}>
                <Route path="/" element={<><MetaData title="Shop" /><Home /></>} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<><MetaData title="Cart" /><Cart /></>} />
                <Route path="/login" element={<><MetaData title="Login" /><Login /></>} />
                <Route path="/register" element={<><MetaData title="Register" /><Register /></>} />
                <Route path="/password/forgot" element={<><MetaData title="Forgot password" /><ForgotPassword /></>} />

                {/* Logged-in customers only */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/me" element={<><MetaData title="My profile" /><Profile /></>} />
                    <Route path="/me/update" element={<><MetaData title="Update profile" /><UpdateProfile /></>} />
                    <Route path="/password/update" element={<><MetaData title="Change password" /><UpdatePassword /></>} />
                    <Route path="/order/success" element={<><MetaData title="Order placed" /><OrderSuccess /></>} />
                    <Route path="/orders/me" element={<><MetaData title="My orders" /><ListOrders /></>} />
                    <Route path="/order/:id" element={<><MetaData title="Order details" /><OrderDetails /></>} />
                </Route>

                <Route path="*" element={<h2>Page not found</h2>} />
            </Route>

            {/* Checkout: slim header, form on the left, order summary on the right */}
            <Route element={<ProtectedRoute />}>
                <Route element={<CheckoutLayout />}>
                    <Route path="/shipping" element={<><MetaData title="Shipping" /><Shipping /></>} />
                    <Route path="/confirm" element={<><MetaData title="Review order" /><ConfirmOrder /></>} />
                    <Route path="/payment" element={<><MetaData title="Payment" /><Payment /></>} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute adminOnly />}>
                <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<><MetaData title="Admin - Dashboard" /><Dashboard /></>} />
                    <Route path="/admin/products" element={<><MetaData title="Admin - Products" /><ProductsList /></>} />
                    <Route path="/admin/product/new" element={<><MetaData title="Admin - New product" /><NewProduct /></>} />
                    <Route path="/admin/product/:id" element={<><MetaData title="Admin - Update product" /><UpdateProduct /></>} />
                    <Route path="/admin/orders" element={<><MetaData title="Admin - Orders" /><OrdersList /></>} />
                    <Route path="/admin/order/:id" element={<><MetaData title="Admin - Process order" /><ProcessOrder /></>} />
                    <Route path="/admin/users" element={<><MetaData title="Admin - Users" /><UsersList /></>} />
                    <Route path="/admin/user/:id" element={<><MetaData title="Admin - User details" /><UpdateUser /></>} />
                    <Route path="/admin/reviews" element={<><MetaData title="Admin - Reviews" /><ReviewsList /></>} />
                </Route>
            </Route>
        </Routes>
    );
}

export default App;
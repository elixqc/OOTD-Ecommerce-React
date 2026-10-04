import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { listenToAuthChanges } from './actions/userActions';
import CustomerLayout from './Components/Layout/CustomerLayout';
import AdminLayout from './Components/Admin/AdminLayout';
import ProtectedRoute from './Components/Route/ProtectedRoute';
import Home from './Components/Home';
import Login from './Components/User/Login';
import Register from './Components/User/Register';
import ForgotPassword from './Components/User/ForgotPassword';
import Profile from './Components/User/Profile';
import UpdateProfile from './Components/User/UpdateProfile';
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
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/password/forgot" element={<ForgotPassword />} />

                {/* Logged-in customers only */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/me" element={<Profile />} />
                    <Route path="/me/update" element={<UpdateProfile />} />
                    <Route path="/shipping" element={<Shipping />} />
                    <Route path="/confirm" element={<ConfirmOrder />} />
                    <Route path="/order/success" element={<OrderSuccess />} />
                    <Route path="/orders/me" element={<ListOrders />} />
                    <Route path="/order/:id" element={<OrderDetails />} />
                </Route>

                <Route path="*" element={<h2>Page not found</h2>} />
            </Route>

            <Route element={<ProtectedRoute adminOnly />}>
                <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<Dashboard />} />
                    <Route path="/admin/products" element={<ProductsList />} />
                    <Route path="/admin/product/new" element={<NewProduct />} />
                    <Route path="/admin/product/:id" element={<UpdateProduct />} />
                    <Route path="/admin/orders" element={<OrdersList />} />
                    <Route path="/admin/order/:id" element={<ProcessOrder />} />
                    <Route path="/admin/users" element={<UsersList />} />
                    <Route path="/admin/user/:id" element={<UpdateUser />} />
                    <Route path="/admin/reviews" element={<ReviewsList />} />
                </Route>
            </Route>
        </Routes>
    );
}

export default App;
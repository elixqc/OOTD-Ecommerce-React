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
import Dashboard from './Components/Admin/Dashboard';
import ProductsList from './Components/Admin/ProductsList';
import NewProduct from './Components/Admin/NewProduct';
import UpdateProduct from './Components/Admin/UpdateProduct';

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
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<h2>Page not found</h2>} />
            </Route>

            <Route element={<ProtectedRoute adminOnly />}>
                <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<Dashboard />} />
                    <Route path="/admin/products" element={<ProductsList />} />
                    <Route path="/admin/product/new" element={<NewProduct />} />
                    <Route path="/admin/product/:id" element={<UpdateProduct />} />
                </Route>
            </Route>
        </Routes>
    );
}

export default App;
// CORE + Q4 · Clerk — top-level routes, layouts and auth sync.
// Mounts storefront/checkout/admin route trees, guards them with ProtectedRoute and dispatches syncUser.
import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@clerk/react';
import { syncUser } from './actions/userActions';
import CustomerLayout from './Components/Layout/CustomerLayout';
import AdminLayout from './Components/Admin/AdminLayout';
import ProtectedRoute from './Components/Route/ProtectedRoute';
import MetaData from './Components/Layout/MetaData';
import CheckoutLayout from './Components/Cart/CheckoutLayout';
import Payment from './Components/Cart/Payment';
import Home from './Components/Home';
import AuthPage from './Components/User/AuthPage';
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
import { getWishlist } from './actions/wishlistActions';
import Wishlist from './Components/Wishlist/Wishlist';
import MyReviews from './Components/Review/MyReviews';
import UpdateUser from './Components/Admin/UpdateUser';
import SSOCallback from './Components/User/SSOCallback';
import NotFound from './Components/Layout/NotFound';
import {
    ContactPage,
    FaqPage,
    PrivacyPage,
    ReturnPage,
    ShippingPage,
    TermsPage,
} from './Components/Support/SupportPages';

// Every time the page changes, start at the top
function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

function App() {
    const dispatch = useDispatch();
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useSelector((state) => state.auth);
    const isCustomer = user?.role === 'customer';

    // Load the user from our database once Clerk knows who is signed in
    useEffect(() => {
        if (!isLoaded) return;
        dispatch(syncUser(isSignedIn));
    }, [dispatch, isLoaded, isSignedIn]);

    // Load the customer's saved products so every heart on the site knows what is already saved
    useEffect(() => {
        if (isCustomer) dispatch(getWishlist());
    }, [dispatch, isCustomer]);

    return (
        <>
            <ScrollToTop />
            <Routes>
                <Route element={<CustomerLayout />}>
                    <Route
                        path="/"
                        element={
                            <>
                                <MetaData title="Shop" />
                                <Home />
                            </>
                        }
                    />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route
                        path="/cart"
                        element={
                            <>
                                <MetaData title="Cart" />
                                <Cart />
                            </>
                        }
                    />
                    {/* Login, register and password reset share one page so the card can slide between them */}
                    <Route element={<AuthPage />}>
                        <Route path="/login/*" element={null} />
                        <Route path="/register/*" element={null} />
                        <Route path="/forgot-password/*" element={null} />
                    </Route>
                    <Route path="/sso-callback" element={<SSOCallback />} />
                    <Route
                        path="/me"
                        element={
                            <>
                                <MetaData title="My profile" />
                                <Profile />
                            </>
                        }
                    />

                    {/* Logged-in customers only */}
                    <Route element={<ProtectedRoute />}>
                        <Route
                            path="/me/update"
                            element={
                                <>
                                    <MetaData title="Update profile" />
                                    <UpdateProfile />
                                </>
                            }
                        />
                        <Route
                            path="/password/update/*"
                            element={
                                <>
                                    <MetaData title="Change password" />
                                    <UpdatePassword />
                                </>
                            }
                        />
                        <Route
                            path="/order/success"
                            element={
                                <>
                                    <MetaData title="Order placed" />
                                    <OrderSuccess />
                                </>
                            }
                        />
                        <Route
                            path="/orders/me"
                            element={
                                <>
                                    <MetaData title="My orders" />
                                    <ListOrders />
                                </>
                            }
                        />
                        <Route
                            path="/wishlist"
                            element={
                                <>
                                    <MetaData title="My wishlist" />
                                    <Wishlist />
                                </>
                            }
                        />
                        <Route
                            path="/reviews/me"
                            element={
                                <>
                                    <MetaData title="My reviews" />
                                    <MyReviews />
                                </>
                            }
                        />
                        <Route
                            path="/order/:id"
                            element={
                                <>
                                    <MetaData title="Order details" />
                                    <OrderDetails />
                                </>
                            }
                        />
                    </Route>

                    {/* Support and legal pages (footer links) */}
                    <Route
                        path="/support/contact"
                        element={
                            <>
                                <MetaData title="Contact us" />
                                <ContactPage />
                            </>
                        }
                    />
                    <Route
                        path="/support/shipping"
                        element={
                            <>
                                <MetaData title="Shipping" />
                                <ShippingPage />
                            </>
                        }
                    />
                    <Route
                        path="/support/return"
                        element={
                            <>
                                <MetaData title="Return" />
                                <ReturnPage />
                            </>
                        }
                    />
                    <Route
                        path="/support/faq"
                        element={
                            <>
                                <MetaData title="FAQ" />
                                <FaqPage />
                            </>
                        }
                    />
                    <Route
                        path="/terms"
                        element={
                            <>
                                <MetaData title="Terms of Service" />
                                <TermsPage />
                            </>
                        }
                    />
                    <Route
                        path="/privacy"
                        element={
                            <>
                                <MetaData title="Privacy Policy" />
                                <PrivacyPage />
                            </>
                        }
                    />

                    <Route path="*" element={<NotFound />} />
                </Route>

                {/* Checkout: slim header, form on the left, order summary on the right */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<CheckoutLayout />}>
                        <Route
                            path="/shipping"
                            element={
                                <>
                                    <MetaData title="Shipping" />
                                    <Shipping />
                                </>
                            }
                        />
                        <Route
                            path="/confirm"
                            element={
                                <>
                                    <MetaData title="Review order" />
                                    <ConfirmOrder />
                                </>
                            }
                        />
                        <Route
                            path="/payment"
                            element={
                                <>
                                    <MetaData title="Payment" />
                                    <Payment />
                                </>
                            }
                        />
                    </Route>
                </Route>

                <Route element={<ProtectedRoute adminOnly />}>
                    <Route element={<AdminLayout />}>
                        <Route
                            path="/admin"
                            element={
                                <>
                                    <MetaData title="Admin - Dashboard" />
                                    <Dashboard />
                                </>
                            }
                        />
                        <Route
                            path="/admin/products"
                            element={
                                <>
                                    <MetaData title="Admin - Products" />
                                    <ProductsList />
                                </>
                            }
                        />
                        <Route
                            path="/admin/product/new"
                            element={
                                <>
                                    <MetaData title="Admin - New product" />
                                    <NewProduct />
                                </>
                            }
                        />
                        <Route
                            path="/admin/product/:id"
                            element={
                                <>
                                    <MetaData title="Admin - Update product" />
                                    <UpdateProduct />
                                </>
                            }
                        />
                        <Route
                            path="/admin/orders"
                            element={
                                <>
                                    <MetaData title="Admin - Orders" />
                                    <OrdersList />
                                </>
                            }
                        />
                        <Route
                            path="/admin/order/:id"
                            element={
                                <>
                                    <MetaData title="Admin - Process order" />
                                    <ProcessOrder />
                                </>
                            }
                        />
                        <Route
                            path="/admin/users"
                            element={
                                <>
                                    <MetaData title="Admin - Users" />
                                    <UsersList />
                                </>
                            }
                        />
                        <Route
                            path="/admin/user/:id"
                            element={
                                <>
                                    <MetaData title="Admin - User details" />
                                    <UpdateUser />
                                </>
                            }
                        />
                        <Route
                            path="/admin/reviews"
                            element={
                                <>
                                    <MetaData title="Admin - Reviews" />
                                    <ReviewsList />
                                </>
                            }
                        />
                    </Route>
                </Route>
            </Routes>
        </>
    );
}

export default App;

import { Link, NavLink, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@mui/material';
import { logout } from '../../actions/userActions';

export default function AdminLayout() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    return (
        <div className="admin-shell">
            <aside className="admin-sidebar">
                <h2 className="admin-brand">OOTD Admin</h2>

                <nav className="admin-nav">
                    <NavLink to="/admin" end>
                        Dashboard
                    </NavLink>
                    <NavLink to="/admin/products" end>
                        Products
                    </NavLink>
                    <NavLink to="/admin/product/new">New product</NavLink>
                    <Link to="/">Back to store</Link>
                </nav>

                <div className="admin-sidebar-footer">
                    <span>{user?.name}</span>
                    <Button color="inherit" onClick={() => dispatch(logout())}>
                        Logout
                    </Button>
                </div>
            </aside>

            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    );
}
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppBar, Badge, Button, IconButton, Toolbar, Typography } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { logout } from '../../actions/userActions';
import { notifySuccess } from '../../Utils/helpers';

export default function Header() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { cartItems } = useSelector((state) => state.cart);
    const isAdmin = user?.role === 'admin';
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const handleLogout = async () => {
        await dispatch(logout());
        notifySuccess('Logged out');
        navigate('/');
    };

    return (
        <AppBar position="sticky" color="primary">
            <Toolbar>
                <Typography variant="h6" component={Link} to="/" className="brand-link">
                    OOTD
                </Typography>
                <div className="navbar-spacer" />

                <IconButton color="inherit" component={Link} to="/cart" aria-label="Shopping cart">
                    <Badge badgeContent={cartCount} color="secondary">
                        <ShoppingCartIcon />
                    </Badge>
                </IconButton>

                {user && (
                    <Button color="inherit" component={Link} to="/orders/me">
                        My orders
                    </Button>
                )}

                {isAdmin && (
                    <Button color="inherit" component={Link} to="/admin">
                        Admin
                    </Button>
                )}

                {user ? (
                    <>
                        <Button color="inherit" component={Link} to="/me">
                            {user.name}
                        </Button>
                        <Button color="inherit" onClick={handleLogout}>
                            Logout
                        </Button>
                    </>
                ) : (
                    <>
                        <Button color="inherit" component={Link} to="/login">
                            Login
                        </Button>
                        <Button color="inherit" component={Link} to="/register">
                            Register
                        </Button>
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
}
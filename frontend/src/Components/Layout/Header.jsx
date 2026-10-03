import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppBar, Button, Toolbar, Typography } from '@mui/material';
import { logout } from '../../actions/userActions';
import { notifySuccess } from '../../Utils/helpers';

export default function Header() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const isAdmin = user?.role === 'admin';

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

                {isAdmin && (
                    <Button color="inherit" component={Link} to="/admin">
                        Admin
                    </Button>
                )}

                {user ? (
                    <>
                        <span className="navbar-user">{user.name}</span>
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
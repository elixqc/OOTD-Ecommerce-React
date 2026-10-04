import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, Button, Card, Chip, CircularProgress, Typography } from '@mui/material';
import { clearErrors, getUserDetails, updateUser } from '../../actions/userActions';
import { UPDATE_USER_RESET } from '../../constants/userConstants';
import { confirmAction, formatDate, notifyError, notifySuccess } from '../../Utils/helpers';

export default function UpdateUser() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { user, orderCount, loading, error } = useSelector((state) => state.userDetails);
    const { loading: updating, isUpdated, updatedUser, error: updateError } = useSelector((state) => state.adminUser);

    useEffect(() => {
        dispatch(getUserDetails(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (error) {
            notifyError(error);
            dispatch(clearErrors());
        }
        if (updateError) {
            notifyError(updateError);
            dispatch(clearErrors());
        }
    }, [error, updateError, dispatch]);

    useEffect(() => {
        if (isUpdated) {
            notifySuccess(updatedUser?.isActive ? 'Account activated' : 'Account deactivated');
            dispatch({ type: UPDATE_USER_RESET });
            dispatch(getUserDetails(id));
        }
    }, [isUpdated, updatedUser, id, dispatch]);

    // The store can still hold a different user for one render
    const ready = user && user._id === id;

    if (!ready) {
        if (loading || loading === undefined) {
            return (
                <div className="loading-screen">
                    <CircularProgress />
                </div>
            );
        }
        return (
            <div className="catalog-message">
                <Typography variant="h5">{error || 'User not found'}</Typography>
                <Button variant="contained" component={Link} to="/admin/users">
                    Back to users
                </Button>
            </div>
        );
    }

    const address = user.shippingAddress || {};
    const fullAddress = [address.address, address.city, address.postalCode, address.country]
        .filter(Boolean)
        .join(', ');

    const handleToggle = async () => {
        const deactivating = user.isActive;
        const confirmed = await confirmAction(
            deactivating ? 'Deactivate this account?' : 'Activate this account?',
            deactivating
                ? `${user.name} won't be able to log in or use their account until you activate it again.`
                : `${user.name} will be able to log in again.`,
            deactivating ? 'Yes, deactivate' : 'Yes, activate'
        );
        if (confirmed) dispatch(updateUser(user._id, !deactivating));
    };

    return (
        <>
            <div className="page-header">
                <Typography variant="h4" component="h1">
                    User account
                </Typography>
                <Button component={Link} to="/admin/users">
                    Back to users
                </Button>
            </div>

            <Card className="profile-card profile-card-left">
                <div className="profile-header">
                    <Avatar src={user.avatar?.url || undefined} alt={user.name} sx={{ width: 80, height: 80 }}>
                        {user.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <div>
                        <Typography variant="h5">{user.name}</Typography>
                        <Chip
                            size="small"
                            label={user.isActive ? 'Active' : 'Deactivated'}
                            color={user.isActive ? 'success' : 'default'}
                        />
                    </div>
                </div>

                <dl className="profile-details">
                    <dt>Email</dt>
                    <dd>{user.email}</dd>
                    <dt>Phone</dt>
                    <dd>{user.phone || 'Not added'}</dd>
                    <dt>Shipping address</dt>
                    <dd>{fullAddress || 'Not added'}</dd>
                    <dt>Role</dt>
                    <dd>{user.role}</dd>
                    <dt>Orders</dt>
                    <dd>{orderCount}</dd>
                    <dt>Joined</dt>
                    <dd>{formatDate(user.createdAt)}</dd>
                </dl>

                {user.role === 'admin' ? (
                    <Typography variant="body2" color="text.secondary">
                        Admin accounts can't be deactivated here.
                    </Typography>
                ) : (
                    <Button
                        variant="contained"
                        color={user.isActive ? 'error' : 'success'}
                        onClick={handleToggle}
                        disabled={updating}
                    >
                        {updating ? 'Saving...' : user.isActive ? 'Deactivate account' : 'Activate account'}
                    </Button>
                )}
            </Card>
        </>
    );
}
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Avatar, Button, Card, Typography } from '@mui/material';
import { formatDate } from '../../Utils/helpers';

export default function Profile() {
    const { user } = useSelector((state) => state.auth);
    const address = user.shippingAddress || {};
    const fullAddress = [address.address, address.city, address.postalCode, address.country]
        .filter(Boolean)
        .join(', ');

    return (
        <Card className="profile-card">
            <div className="profile-header">
                <Avatar src={user.avatar?.url || undefined} alt={user.name} sx={{ width: 96, height: 96 }}>
                    {user.name?.[0]?.toUpperCase()}
                </Avatar>
                <div>
                    <Typography variant="h5" component="h1">
                        {user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Member since {formatDate(user.createdAt)}
                    </Typography>
                </div>
            </div>

            <dl className="profile-details">
                <dt>Email</dt>
                <dd>{user.email}</dd>
                <dt>Phone</dt>
                <dd>{user.phone || 'Not added yet'}</dd>
                <dt>Shipping address</dt>
                <dd>{fullAddress || 'Not added yet'}</dd>
            </dl>

            <div className="button-row">
                <Button variant="contained" component={Link} to="/me/update">
                    Edit profile
                </Button>
                <Button component={Link} to="/orders/me">
                    My orders
                </Button>
            </div>
        </Card>
    );
}
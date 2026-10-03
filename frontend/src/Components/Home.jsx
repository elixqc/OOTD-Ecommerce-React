import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button, Typography } from '@mui/material';

export default function Home() {
    const { user } = useSelector((state) => state.auth);

    return (
        <section className="home-hero">
            <Typography variant="h3" component="h1">
                Own. Outfit. Today.
            </Typography>
            <Typography variant="body1" className="home-subtitle">
                {user
                    ? `Welcome, ${user.name}. The product catalog is coming next.`
                    : 'Create an account to start shopping. The product catalog is coming next.'}
            </Typography>
            {!user && (
                <Button variant="contained" component={Link} to="/register">
                    Get started
                </Button>
            )}
        </section>
    );
}
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button, Typography } from '@mui/material';
import Catalog from './Product/Catalog';
import heroImage from '../assets/ootd-hero.jpeg';

export default function Home() {
    const { user } = useSelector((state) => state.auth);

    return (
        <>
            <section className="home-hero">
                <img src={heroImage} alt="Four models wearing OOTD streetwear" className="home-hero-img" />
                <div className="home-hero-content">
                    <Typography variant="h3" component="h1">
                        Own. Outfit. Today.
                    </Typography>
                    <Typography variant="body1" className="home-subtitle">
                        {user ? `Welcome, ${user.name}.` : 'Create an account to start shopping.'}
                    </Typography>
                    {!user && (
                        <Button variant="contained" component={Link} to="/register">
                            Get started
                        </Button>
                    )}
                </div>
            </section>
            <div className="home-shop">
                <Catalog />
            </div>
        </>
    );
}
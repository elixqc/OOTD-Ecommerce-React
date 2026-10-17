import { useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button, Typography } from '@mui/material';
import Catalog from './Product/Catalog';
import heroImage from '../assets/ootd-hero.jpg';
import { notifyError } from '../Utils/helpers';

export default function Home() {
    const { user } = useSelector((state) => state.auth);
    const [searchParams] = useSearchParams();
    const location = useLocation();
    // A search or a footer category link both bring the shop section into view
    const searching = Boolean(searchParams.get('q') || searchParams.get('category'));
    const shopRef = useRef(null);

    const scrollToShop = () => shopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    useEffect(() => {
        if (searching) scrollToShop();
    }, [searching, searchParams, location.key]);

    useEffect(() => {
        if (location.state?.denied) notifyError("You don't have access to that page");
    }, [location.state]);
    return (
        <>
            <section className="home-hero">
                <img
                    src={heroImage}
                    alt="Four models wearing OOTD streetwear"
                    className="home-hero-img"
                    onLoad={() => searching && scrollToShop()}
                />
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
            <div className="home-shop" ref={shopRef} style={{ scrollMarginTop: 72 }}>
                <Catalog />
            </div>
        </>
    );
}
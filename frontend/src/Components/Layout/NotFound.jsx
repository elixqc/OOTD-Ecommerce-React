import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import MetaData from './MetaData';

export default function NotFound() {
    const navigate = useNavigate();
    const location = useLocation();
    // "default" means this is the first page of the tab, so there is nothing to go back to
    const canGoBack = location.key !== 'default';

    return (
        <>
            <MetaData title="Page not found" />
            <Box
                sx={{
                    minHeight: '60vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: 1.5,
                    py: 6,
                }}
            >
                <Typography
                    component="p"
                    sx={{
                        fontSize: { xs: 96, md: 160 },
                        fontWeight: 800,
                        lineHeight: 1,
                        letterSpacing: '-0.04em',
                        color: 'primary.main',
                    }}
                >
                    4
                    <Box component="span" sx={{ color: 'secondary.main' }}>
                        0
                    </Box>
                    4
                </Typography>

                <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                    Page not found
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
                    The page you&apos;re looking for doesn&apos;t exist or may have been moved.
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5, mt: 2 }}>
                    <Button component={Link} to="/" variant="contained" size="large">
                        Back to shop
                    </Button>
                    {canGoBack && (
                        <Button variant="outlined" size="large" onClick={() => navigate(-1)}>
                            Go back
                        </Button>
                    )}
                </Box>
            </Box>
        </>
    );
}
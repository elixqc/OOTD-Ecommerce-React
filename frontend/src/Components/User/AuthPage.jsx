// Q4 · Clerk login + U2 · UI — shared auth shell.
// Hosts Login, Register and ForgotPassword in one sliding card with the hero photo panel.
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Paper, Typography } from '@mui/material';
import heroImage from '../../assets/ootd-hero.jpg';
import MetaData from '../Layout/MetaData';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import { EASE, fadeIn, floatA, floatB, riseIn, slowZoom } from './authMotion';

const COPY = {
    login: {
        lines: ['Own.', 'Outfit.'],
        accent: 'Today.',
        text: 'Your style, one login away. Track your orders and check out faster.',
    },
    register: {
        lines: ['Your style.', 'Your fit.'],
        accent: 'Start here.',
        text: 'Make an account to save your bag and check out in a few taps.',
    },
    forgot: {
        lines: ['Forgot your', 'password?'],
        accent: 'Reset it.',
        text: "We'll email you a code, then you pick a new one. It takes a minute.",
    },
};

const reducedMotion = '@media (prefers-reduced-motion: reduce)';

// The forms sit in the same grid row, so the card is always as tall as the tallest form
// and never needs a scrollbar. The inactive forms fade and slide away from the photo.
const panelSx = (active, side) => ({
    gridRow: 1,
    gridColumn: { xs: 1, md: side === 'left' ? 1 : 2 },
    boxSizing: 'border-box',
    p: { xs: 3, sm: 5, md: 6 },
    display: { xs: active ? 'flex' : 'none', md: 'flex' },
    flexDirection: 'column',
    justifyContent: 'center',
    opacity: active ? 1 : 0,
    visibility: active ? 'visible' : 'hidden',
    pointerEvents: active ? 'auto' : 'none',
    transform: { md: active ? 'translateX(0)' : `translateX(${side === 'left' ? '-14%' : '14%'})` },
    transition: {
        md:
            `transform 0.8s ${EASE}, opacity 0.5s ease ${active ? '0.3s' : '0s'}, ` +
            `visibility 0s linear ${active ? '0s' : '0.8s'}`,
    },
    animation: { xs: active ? `${fadeIn} 0.4s ease` : 'none', md: 'none' },
    [reducedMotion]: { transition: 'none', animation: 'none' },
});

export default function AuthPage() {
    const { pathname } = useLocation();
    const { user } = useSelector((state) => state.auth);
    if (user?.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }
    const mode = pathname.startsWith('/register')
        ? 'register'
        : pathname.startsWith('/forgot-password')
          ? 'forgot'
          : 'login';
    const isLogin = mode === 'login';
    const isRegister = mode === 'register';
    const isForgot = mode === 'forgot';
    // The photo covers the half without a form: right for login/forgot, left for register
    const photoRight = !isRegister;
    const copy = COPY[mode];

    return (
        <Box
            sx={{
                // Break out of the page container so the backdrop runs edge to edge
                position: 'relative',
                width: '100vw',
                ml: 'calc(50% - 50vw)',
                my: -3,
                px: 2,
                py: { xs: 4, md: 6 },
                minHeight: { xs: 'calc(100vh - 57px)', md: 'calc(100vh - 65px)' },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxSizing: 'border-box',
                background:
                    'radial-gradient(1200px 600px at 10% -10%, rgba(200,85,61,0.16), ' +
                    'transparent 60%), radial-gradient(900px 500px at 100% 110%, ' +
                    'rgba(31,31,31,0.10), transparent 60%), linear-gradient(180deg, ' +
                    '#fbf9f6 0%, #f1ece6 100%)',
                // Soft dot grid
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'radial-gradient(rgba(31,31,31,0.10) 1px, transparent 1px)',
                    backgroundSize: '22px 22px',
                    maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 75%)',
                    WebkitMaskImage:
                        'radial-gradient(ellipse at center, #000 30%, transparent 75%)',
                },
            }}
        >
            <MetaData title={isLogin ? 'Login' : isRegister ? 'Register' : 'Forgot password'} />

            {/* Drifting colour blobs */}
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    top: '-12%',
                    left: '-8%',
                    width: { xs: 280, md: 460 },
                    height: { xs: 280, md: 460 },
                    borderRadius: '50%',
                    bgcolor: 'secondary.main',
                    opacity: 0.28,
                    filter: 'blur(90px)',
                    animation: `${floatA} 18s ease-in-out infinite alternate`,
                    [reducedMotion]: { animation: 'none' },
                }}
            />
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    bottom: '-15%',
                    right: '-6%',
                    width: { xs: 300, md: 520 },
                    height: { xs: 300, md: 520 },
                    borderRadius: '50%',
                    bgcolor: '#6b7cff',
                    opacity: 0.18,
                    filter: 'blur(110px)',
                    animation: `${floatB} 22s ease-in-out infinite alternate`,
                    [reducedMotion]: { animation: 'none' },
                }}
            />

            <Paper
                elevation={0}
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    borderRadius: 3,
                    animation: `${riseIn} 0.8s ${EASE} both`,
                    [reducedMotion]: { animation: 'none' },
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    width: '100%',
                    maxWidth: 1000,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'rgba(255,255,255,0.7)',
                    bgcolor: 'background.paper',
                    boxShadow:
                        '0 2px 4px rgba(31,31,31,0.04), 0 12px 24px ' +
                        'rgba(31,31,31,0.08), 0 40px 90px rgba(31,31,31,0.18)',
                }}
            >
                <Box sx={panelSx(isLogin, 'left')}>
                    <Login active={isLogin} />
                </Box>
                <Box sx={panelSx(isRegister, 'right')}>
                    <Register active={isRegister} />
                </Box>
                <Box sx={panelSx(isForgot, 'left')}>
                    <ForgotPassword active={isForgot} />
                </Box>

                {/* Photo panel: covers the half that isn't in use and glides across
                    when the mode changes */}
                <Box
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: '50%',
                        zIndex: 2,
                        overflow: 'hidden',
                        bgcolor: 'primary.main',
                        color: '#faf8f5',
                        transform: photoRight ? 'translateX(100%)' : 'translateX(0)',
                        transition: `transform 0.8s ${EASE}`,
                        [reducedMotion]: { transition: 'none' },
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `url(${heroImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            animation: `${slowZoom} 22s ease-in-out infinite alternate`,
                            [reducedMotion]: { animation: 'none' },
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            background:
                                'linear-gradient(180deg, rgba(20,20,20,0.55) 0%, ' +
                                'rgba(20,20,20,0.15) 40%, rgba(20,20,20,0.85) 100%)',
                        }}
                    />

                    <Box
                        sx={{
                            position: 'relative',
                            height: '100%',
                            p: 6,
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 3 }}>
                            OOTD
                        </Typography>

                        {/* Keyed so the copy re-enters each time the panel changes sides */}
                        <Box
                            key={mode}
                            sx={{
                                animation: `${riseIn} 0.8s ${EASE} 0.35s both`,
                                [reducedMotion]: { animation: 'none' },
                            }}
                        >
                            <Typography
                                variant="h2"
                                sx={{ fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em' }}
                            >
                                {copy.lines.map((line) => (
                                    <Box component="span" key={line} sx={{ display: 'block' }}>
                                        {line}
                                    </Box>
                                ))}
                                <Box
                                    component="span"
                                    sx={{ display: 'block', color: 'secondary.main' }}
                                >
                                    {copy.accent}
                                </Box>
                            </Typography>
                            <Typography sx={{ mt: 2, maxWidth: 320, opacity: 0.8 }}>
                                {copy.text}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}

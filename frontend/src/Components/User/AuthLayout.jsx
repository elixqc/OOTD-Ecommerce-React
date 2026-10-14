import { Box, Paper, Typography } from '@mui/material';

export default function AuthLayout({ title, subtitle, footer, children }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 1, md: 5 } }}>
            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    maxWidth: 960,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                {/* Brand panel (hidden on mobile) */}
                <Box
                    sx={{
                        display: { xs: 'none', md: 'flex' },
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        p: 5,
                        bgcolor: 'primary.main',
                        color: '#faf8f5',
                    }}
                >
                    <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 3 }}>
                        OOTD
                    </Typography>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                            Own.
                            <br />
                            Outfit.
                            <br />
                            <Box component="span" sx={{ color: 'secondary.main' }}>
                                Today.
                            </Box>
                        </Typography>
                        <Typography sx={{ mt: 2, opacity: 0.7 }}>
                            Your style, one login away. Track your orders and check out faster.
                        </Typography>
                    </Box>
                </Box>

                {/* Form panel */}
                <Box sx={{ p: { xs: 3, sm: 5 }, bgcolor: 'background.paper' }}>
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                        {title}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
                        {subtitle}
                    </Typography>
                    {children}
                    {footer && (
                        <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
                            {footer}
                        </Typography>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
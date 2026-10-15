import { Box, Typography } from '@mui/material';

export default function AuthHeading({ title, subtitle }) {
    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                {title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
            </Typography>
        </Box>
    );
}
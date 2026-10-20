import { Box, Button } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

export default function SocialButtons({ onGoogle, disabled }) {
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5 }}>
            <Button variant="outlined" color="primary" startIcon={<GoogleIcon />} onClick={onGoogle} disabled={disabled}>
                Google
            </Button>
        </Box>
    );
}

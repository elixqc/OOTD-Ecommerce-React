import { Box, Button } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';

export default function SocialButtons({ onGoogle, onFacebook, disabled }) {
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Button variant="outlined" color="primary" startIcon={<GoogleIcon />} onClick={onGoogle} disabled={disabled}>
                Google
            </Button>
            <Button variant="outlined" color="primary" startIcon={<FacebookIcon />} onClick={onFacebook} disabled={disabled}>
                Facebook
            </Button>
        </Box>
    );
}
// Q4 · Clerk login + U2 · UI — login/register switch.
// Toggles between the two auth forms inside AuthPage.
import { Link as RouterLink } from 'react-router-dom';
import { Link, Typography } from '@mui/material';

// "Don't have an account? Sign up" line that sits at the bottom of each form
export default function AuthSwitch({ prompt, cta, to }) {
    return (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 1 }}>
            {prompt}{' '}
            <Link
                component={RouterLink}
                to={to}
                color="primary"
                underline="always"
                fontWeight={700}
            >
                {cta}
            </Link>
        </Typography>
    );
}

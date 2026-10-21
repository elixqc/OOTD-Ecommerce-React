// Q4 · Clerk login — OAuth redirect handler.
// Finishes the Clerk social sign-in at /sso-callback and returns the user to the app.
import { useNavigate } from 'react-router-dom';
import { HandleSSOCallback } from '@clerk/react';

export default function SSOCallback() {
    const navigate = useNavigate();
    return (
        <HandleSSOCallback
            navigateToApp={() => navigate('/', { replace: true })}
            navigateToSignIn={() => navigate('/login', { replace: true })}
            navigateToSignUp={() => navigate('/register', { replace: true })}
        />
    );
}

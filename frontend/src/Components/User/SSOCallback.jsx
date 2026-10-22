// Q4 · Clerk login — OAuth redirect handler.
// Finishes the Clerk social sign-in at /sso-callback and returns the user to the app.
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HandleSSOCallback } from '@clerk/react';
import { getPostLoginPath } from '../../actions/userActions';

export default function SSOCallback() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const redirected = useRef(false);

    // HandleSSOCallback calls navigateToApp before Clerk activates the session, so our
    // database user isn't loaded yet. Wait for it, then send admins to the dashboard.
    useEffect(() => {
        if (!user || redirected.current) return;
        redirected.current = true;
        navigate(getPostLoginPath(user), { replace: true });
    }, [user, navigate]);

    // Safety net: never leave the user stuck on the callback screen
    useEffect(() => {
        const timer = setTimeout(() => {
            if (redirected.current) return;
            redirected.current = true;
            navigate('/', { replace: true });
        }, 10000);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <HandleSSOCallback
            navigateToApp={() => {}}
            navigateToSignIn={() => navigate('/login', { replace: true })}
            navigateToSignUp={() => navigate('/register', { replace: true })}
        />
    );
}

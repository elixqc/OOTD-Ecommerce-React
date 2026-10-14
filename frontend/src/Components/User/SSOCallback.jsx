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
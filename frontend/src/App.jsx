import { useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import api from './api';

function App() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await api.post('/register', {
                name: result.user.displayName || 'New User',
            });
            const { data } = await api.get('/me');
            setUser(data.user);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || err.code || err.message);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setUser(null);
        setToken('');
    };

    // Temporary: for testing in Insomnia. Tokens expire after about 1 hour.
    const handleGetToken = async () => {
        const freshToken = await auth.currentUser.getIdToken(true);
        setToken(freshToken);
    };

    return (
        <div>
            <h1>OOTD backend test</h1>
            {user ? (
                <>
                    <p>Signed in as: {user.email} (role: {user.role})</p>
                    <button onClick={handleGetToken}>Show ID token</button>{' '}
                    <button onClick={handleLogout}>Sign out</button>
                    {token && <textarea readOnly rows={6} cols={80} value={token} />}
                </>
            ) : (
                <button onClick={handleLogin}>Sign in with Google</button>
            )}
            {error && <p>Error: {error}</p>}
        </div>
    );
}

export default App;
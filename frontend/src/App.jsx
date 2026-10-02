import { useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import api from './api';

function App() {
    const [user, setUser] = useState(null);
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
    };

    return (
        <div>
            <h1>OOTD backend test</h1>
            {user ? (
                <>
                    <p>Signed in as: {user.email} (role: {user.role})</p>
                    <pre>{JSON.stringify(user, null, 2)}</pre>
                    <button onClick={handleLogout}>Sign out</button>
                </>
            ) : (
                <button onClick={handleLogin}>Sign in with Google</button>
            )}
            {error && <p>Error: {error}</p>}
        </div>
    );
}

export default App;
import { useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

function App() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            setEmail(result.user.email);
            setError('');
        } catch (err) {
            setError(err.code);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setEmail('');
    };

    return (
        <div>
            <h1>OOTD Firebase test</h1>
            {email ? (
                <>
                    <p>Signed in as: {email}</p>
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
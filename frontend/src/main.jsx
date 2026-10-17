import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ClerkProvider } from '@clerk/react';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App.jsx';
import store from './store';
import theme from './theme';
import './style.css';
import { Toaster } from 'sonner';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <ClerkProvider
                    publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
                    signInUrl="/login"
                    signUpUrl="/register"
                    afterSignOutUrl="/"
                >
                    <StyledEngineProvider injectFirst>
                        <ThemeProvider theme={theme}>
                            <CssBaseline />
                            <App />
                            <Toaster
                                position="bottom-right"
                                toastOptions={{ className: 'ootd-toast' }}
                                style={{
                                    '--normal-bg': '#ffffff',
                                    '--normal-text': '#1f1f1f',
                                    '--normal-border': '#eceef2',
                                    '--border-radius': '14px',
                                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                                }}
                            />
                        </ThemeProvider>
                    </StyledEngineProvider>
                </ClerkProvider>
            </BrowserRouter>
        </Provider>
    </StrictMode>
);
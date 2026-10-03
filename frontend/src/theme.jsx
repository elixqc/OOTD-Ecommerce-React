import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: { main: '#1f1f1f' },
        secondary: { main: '#c8553d' },
        background: { default: '#faf8f5' },
    },
    typography: {
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 8 },
});

export default theme;
// Q4 · Clerk login + U1-B · Validation — password input.
// Formik-connected field with a show/hide toggle, reused across the auth and password forms.
import { useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export default function PasswordField(props) {
    const [show, setShow] = useState(false);

    return (
        <TextField
            {...props}
            type={show ? 'text' : 'password'}
            fullWidth
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position="start">
                            <LockOutlinedIcon fontSize="small" />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label={show ? 'Hide password' : 'Show password'}
                                onClick={() => setShow((s) => !s)}
                                onMouseDown={(event) => event.preventDefault()}
                                edge="end"
                            >
                                {show ? (
                                    <VisibilityOffIcon fontSize="small" />
                                ) : (
                                    <VisibilityIcon fontSize="small" />
                                )}
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
}

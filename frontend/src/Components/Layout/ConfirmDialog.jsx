import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import Box from '@mui/material/Box';

// Standard MUI alert dialog. The parent component owns the open state.
function ConfirmDialog({ open, title, text, confirmText = 'Confirm', onConfirm, onClose }) {
    const handleConfirm = () => {
        onClose();
        onConfirm?.();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-text"
            maxWidth="xs"
            fullWidth
            slotProps={{
                backdrop: { sx: { bgcolor: 'rgba(31, 31, 31, 0.45)', backdropFilter: 'blur(3px)' } },
                paper: {
                    sx: {
                        borderRadius: '20px',
                        border: '1px solid #eceef2',
                        boxShadow: '0 24px 60px rgba(31, 31, 31, 0.18)',
                        p: 1,
                    },
                },
            }}
        >
            <DialogTitle
                id="confirm-dialog-title"
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700, fontSize: '1.2rem' }}
            >
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: 'rgba(200, 85, 61, 0.12)',
                        flexShrink: 0,
                    }}
                >
                    <WarningAmberRoundedIcon color="secondary" fontSize="small" />
                </Box>
                {title}
            </DialogTitle>
            {text && (
                <DialogContent>
                    <DialogContentText id="confirm-dialog-text" sx={{ color: '#6b6b6b' }}>
                        {text}
                    </DialogContentText>
                </DialogContent>
            )}
            <DialogActions sx={{ px: 3, pb: 2, gap: 0.5 }}>
                <Button
                    color="inherit"
                    variant="outlined"
                    onClick={onClose}
                    sx={{ borderRadius: 99, px: 2.5, height: 40, borderColor: '#dcd8d2' }}
                >
                    Cancel
                </Button>
                <Button
                    color="secondary"
                    variant="contained"
                    disableElevation
                    onClick={handleConfirm}
                    autoFocus
                    sx={{ borderRadius: 99, px: 2.5, height: 40 }}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmDialog;
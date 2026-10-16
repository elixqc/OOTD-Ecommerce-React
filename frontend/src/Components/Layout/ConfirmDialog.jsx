import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

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
        >
            <DialogTitle
                id="confirm-dialog-title"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}
            >
                <WarningAmberRoundedIcon color="secondary" />
                {title}
            </DialogTitle>
            {text && (
                <DialogContent>
                    <DialogContentText id="confirm-dialog-text">{text}</DialogContentText>
                </DialogContent>
            )}
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button color="inherit" onClick={onClose}>
                    Cancel
                </Button>
                <Button color="secondary" variant="contained" onClick={handleConfirm} autoFocus>
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmDialog;
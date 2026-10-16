import { useRef, useState } from 'react';
import { Box, ButtonBase, Chip, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGES_PER_COLOR } from '../../constants/productConstants';

const BORDER = '#eceef2';
const TILE = 104;

// Small round button that sits on top of a photo
const overlayButtonSx = {
    position: 'absolute',
    bgcolor: 'rgba(255, 255, 255, 0.92)',
    p: 0.5,
    '&:hover': { bgcolor: '#fff' },
};

// Photo tiles + a click / drag-and-drop area for ONE color.
// The parent owns the images and does the uploading; this only shows them and reports what the admin did.
export default function ColorImageUploader({ images, onFiles, onRemove, onMakeMain }) {
    const input = useRef(null);
    const [dragging, setDragging] = useState(false);
    const full = images.length >= MAX_IMAGES_PER_COLOR;

    const pick = (event) => {
        onFiles(Array.from(event.target.files));
        event.target.value = '';
    };

    const drop = (event) => {
        event.preventDefault();
        setDragging(false);
        if (!full) onFiles(Array.from(event.dataTransfer.files));
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, my: 1.5 }}>
                {images.map((img, index) => (
                    <Box
                        key={img.key}
                        sx={{
                            position: 'relative',
                            width: TILE,
                            height: TILE,
                            overflow: 'hidden',
                            border: `1px solid ${BORDER}`,
                            borderRadius: '12px',
                            bgcolor: '#f3f3f3',
                        }}
                    >
                        <Box
                            component="img"
                            src={img.url}
                            alt=""
                            sx={{ width: '100%', height: '100%', objectFit: 'cover', opacity: img.uploading ? 0.45 : 1 }}
                        />

                        {img.uploading ? (
                            <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                                <CircularProgress
                                    size={36}
                                    color="inherit"
                                    variant={img.progress < 100 ? 'determinate' : 'indeterminate'}
                                    value={img.progress}
                                />
                            </Box>
                        ) : (
                            <>
                                {index === 0 && (
                                    <Chip
                                        size="small"
                                        label="Main"
                                        sx={{
                                            position: 'absolute',
                                            left: 6,
                                            bottom: 6,
                                            height: 20,
                                            fontSize: 11,
                                            bgcolor: 'var(--brand-dark)',
                                            color: '#fff',
                                        }}
                                    />
                                )}
                                <IconButton
                                    size="small"
                                    aria-label="Remove image"
                                    onClick={() => onRemove(img)}
                                    sx={{ ...overlayButtonSx, top: 4, right: 4 }}
                                >
                                    <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                                {index !== 0 && (
                                    <Tooltip title="Make main photo">
                                        <IconButton
                                            size="small"
                                            aria-label="Make main photo"
                                            onClick={() => onMakeMain(img)}
                                            sx={{ ...overlayButtonSx, left: 4, bottom: 4 }}
                                        >
                                            <StarBorderRoundedIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </>
                        )}
                    </Box>
                ))}

                {!full && (
                    <ButtonBase
                        type="button"
                        onClick={() => input.current.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={drop}
                        sx={{
                            flexDirection: 'column',
                            gap: 0.25,
                            width: TILE,
                            height: TILE,
                            border: '2px dashed',
                            borderColor: dragging ? 'secondary.main' : '#cfd3da',
                            borderRadius: '12px',
                            bgcolor: dragging ? 'rgba(200, 85, 61, 0.06)' : 'transparent',
                            color: dragging ? 'secondary.main' : '#8a8f98',
                            transition: 'all 0.2s',
                            '&:hover': { borderColor: 'secondary.main', color: 'secondary.main', bgcolor: 'rgba(200, 85, 61, 0.06)' },
                        }}
                    >
                        <AddPhotoAlternateOutlinedIcon />
                        <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            Add photos
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: 10.5, lineHeight: 1.2 }}>
                            or drop here
                        </Typography>
                    </ButtonBase>
                )}
            </Box>

            <input ref={input} type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} multiple hidden onChange={pick} />
            <Typography variant="caption" color="text.secondary">
                {images.length}/{MAX_IMAGES_PER_COLOR} photos · JPG, PNG or WebP · the first photo is the main one
            </Typography>
        </Box>
    );
}
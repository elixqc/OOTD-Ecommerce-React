import { useRef, useState } from 'react';
import { CircularProgress, IconButton, Tooltip, Typography } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGES_PER_COLOR } from '../../constants/productConstants';

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
        <div>
            <div className="image-grid">
                {images.map((img, index) => (
                    <div className="image-thumb" key={img.key}>
                        <img src={img.url} alt="" className={img.uploading ? 'image-uploading' : undefined} />

                        {img.uploading ? (
                            <div className="image-progress">
                                <CircularProgress size={36} variant={img.progress < 100 ? 'determinate' : 'indeterminate'} value={img.progress} />
                            </div>
                        ) : (
                            <>
                                {index === 0 && <span className="image-main-badge">Main</span>}
                                <IconButton
                                    size="small"
                                    className="image-remove"
                                    aria-label="Remove image"
                                    onClick={() => onRemove(img)}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                                {index !== 0 && (
                                    <Tooltip title="Make main photo">
                                        <IconButton
                                            size="small"
                                            className="image-star"
                                            aria-label="Make main photo"
                                            onClick={() => onMakeMain(img)}
                                        >
                                            <StarBorderIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </>
                        )}
                    </div>
                ))}

                {!full && (
                    <button
                        type="button"
                        className={dragging ? 'image-drop dragging' : 'image-drop'}
                        onClick={() => input.current.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={drop}
                    >
                        <AddPhotoAlternateIcon />
                        <span>Add photos</span>
                        <small>or drop here</small>
                    </button>
                )}
            </div>

            <input ref={input} type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} multiple hidden onChange={pick} />
            <Typography variant="caption" color="text.secondary">
                {images.length}/{MAX_IMAGES_PER_COLOR} photos · JPG, PNG or WebP · the first photo is the main one
            </Typography>
        </div>
    );
}

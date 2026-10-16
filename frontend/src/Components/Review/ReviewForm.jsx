import { useDispatch } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, FormHelperText, Paper, Rating, Stack, TextField, Typography } from '@mui/material';
import { submitReview, updateReview } from '../../actions/reviewActions';
import { notifyError, notifySuccess } from '../../Utils/helpers';

const validationSchema = Yup.object({
    rating: Yup.number().min(1, 'Please choose a star rating').max(5).required('Please choose a star rating'),
    comment: Yup.string()
        .trim()
        .max(1000, 'Review cannot exceed 1000 characters')
        .test('min-length', 'Write at least 3 characters, or leave it empty', (value) => !value || value.length >= 3),
});

// Writes a new review, or edits `existing` when it is given
export default function ReviewForm({ productId, existing, onDone, onCancel }) {
    const dispatch = useDispatch();

    const formik = useFormik({
        initialValues: { rating: existing?.rating ?? 0, comment: existing?.comment ?? '' },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: false,
        onSubmit: async (values) => {
            const data = { rating: values.rating, comment: values.comment.trim() };
            const message = existing
                ? await dispatch(updateReview(existing._id, data))
                : await dispatch(submitReview(productId, data));

            if (message) {
                notifyError(message);
                return;
            }
            notifySuccess(existing ? 'Review updated' : 'Thanks for your review!');
            onDone();
        },
    });

        return (
        <Paper
            component="form"
            variant="outlined"
            onSubmit={formik.handleSubmit}
            noValidate
            className="review-form"
            sx={{ p: 3, mb: 3, borderRadius: 2, borderColor: '#ece9e4' }}
        >
            <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight={600}>
                    {existing ? 'Edit your review' : 'Write a review'}
                </Typography>

                <div>
                    <Rating
                        name="rating"
                        size="large"
                        value={formik.values.rating}
                        onChange={(e, value) => formik.setFieldValue('rating', value ?? 0)}
                    />
                    {formik.errors.rating && <FormHelperText error>{formik.errors.rating}</FormHelperText>}
                </div>

                <TextField
                    label="Your review (optional)"
                    name="comment"
                    multiline
                    minRows={3}
                    fullWidth
                    value={formik.values.comment}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.comment)}
                    helperText={formik.errors.comment}
                />

                <Stack direction="row" spacing={1.5} sx={{ pt: 0.5 }}>
                    <Button type="submit" variant="contained" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? 'Saving...' : existing ? 'Save changes' : 'Submit review'}
                    </Button>
                    {onCancel && <Button onClick={onCancel}>Cancel</Button>}
                </Stack>
            </Stack>
        </Paper>
    );
}

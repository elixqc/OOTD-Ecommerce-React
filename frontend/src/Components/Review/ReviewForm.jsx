// MP3 · Review ratings + U1-B · Validation — write/edit review form.
// Formik + Yup validated; submits to POST/PUT review and is opened from ProductDetails or MyReviews.
import { useDispatch } from 'react-redux';
import { getIn, useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, FormHelperText, Paper, Rating, Stack, TextField, Typography } from '@mui/material';
import { submitReview, updateReview } from '../../actions/reviewActions';
import { notifyError, notifySuccess } from '../../Utils/helpers';

const validationSchema = Yup.object({
    rating: Yup.number()
        .min(1, 'Please choose a star rating')
        .max(5)
        .required('Please choose a star rating'),
    comment: Yup.string()
        .trim()
        .max(1000, 'Review cannot exceed 1000 characters')
        .test(
            'min-length',
            'Write at least 3 characters, or leave it empty',
            (value) => !value || value.length >= 3,
        ),
});

// Writes a new review, or edits `existing` when it is given
export default function ReviewForm({ productId, existing, onDone, onCancel }) {
    const dispatch = useDispatch();

    const formik = useFormik({
        initialValues: { rating: existing?.rating ?? 0, comment: existing?.comment ?? '' },
        validationSchema,
        validateOnChange: true,
        validateOnBlur: true,
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

    // Reveal a field's error once it was blurred, or after any submit attempt.
    // The rating has no blur target, so it only appears after a submit attempt.
    const showError = (name) =>
        formik.submitCount > 0 || getIn(formik.touched, name) === true;
    const errorText = (name) => (showError(name) ? getIn(formik.errors, name) : undefined);

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
                    {existing ? <strong>Edit your review</strong> : <strong>Write a review</strong>}
                </Typography>

                <div>
                    <Rating
                        name="rating"
                        size="large"
                        value={formik.values.rating}
                        onChange={(e, value) => formik.setFieldValue('rating', value ?? 0)}
                    />
                    {showError('rating') && formik.errors.rating && (
                        <FormHelperText error>{formik.errors.rating}</FormHelperText>
                    )}
                </div>

                <TextField
                    label="Your review (optional)"
                    name="comment"
                    multiline
                    minRows={3}
                    fullWidth
                    value={formik.values.comment}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={Boolean(errorText('comment'))}
                    helperText={errorText('comment')}
                />

                <Stack direction="row" spacing={1.5} sx={{ pt: 0.5 }}>
                    <Button type="submit" variant="contained" disabled={formik.isSubmitting}>
                        {formik.isSubmitting
                            ? 'Saving...'
                            : existing
                              ? 'Save changes'
                              : 'Submit review'}
                    </Button>
                    {onCancel && <Button onClick={onCancel}>Cancel</Button>}
                </Stack>
            </Stack>
        </Paper>
    );
}

// TTL · Transactions + U2 · UI — checkout stepper.
// Highlights the current step (Shipping → Review → Payment) across the checkout pages.
import { Step, StepLabel, Stepper } from '@mui/material';

const STEPS = ['Shipping', 'Confirm order', 'Payment', 'Done'];

// activeStep: 0 = Shipping, 1 = Confirm order, 2 = Payment, 4 = everything finished
export default function CheckoutSteps({ activeStep }) {
    return (
        <Stepper activeStep={activeStep} alternativeLabel className="checkout-steps">
            {STEPS.map((label) => (
                <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                </Step>
            ))}
        </Stepper>
    );
}

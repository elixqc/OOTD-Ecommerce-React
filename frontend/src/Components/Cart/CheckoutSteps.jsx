import { Step, StepLabel, Stepper } from '@mui/material';

const STEPS = ['Shipping', 'Confirm order', 'Done'];

// activeStep: 0 = Shipping, 1 = Confirm order, 3 = everything finished
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

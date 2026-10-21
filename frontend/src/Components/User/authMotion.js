// U2 · UI — auth animation constants.
// Shared keyframes/easing imported by AuthPage and the auth forms.
import { keyframes } from '@mui/material/styles';

export const EASE = 'cubic-bezier(0.77, 0, 0.175, 1)';

export const riseIn = keyframes`
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
`;

export const fadeIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

export const slowZoom = keyframes`
    from { transform: scale(1) translate3d(0, 0, 0); }
    to   { transform: scale(1.12) translate3d(-2%, -1.5%, 0); }
`;

// Fields rise in one after another whenever their panel becomes the active one
export const staggerFields = (active, count = 10) => {
    if (!active) return {};
    const sx = { '& > *': { animation: `${riseIn} 0.55s ${EASE} backwards` } };
    for (let i = 1; i <= count; i += 1) {
        sx[`& > *:nth-of-type(${i})`] = { animationDelay: `${0.35 + i * 0.06}s` };
    }
    return sx;
};

export const floatA = keyframes`
    0%   { transform: translate3d(0, 0, 0) scale(1); }
    50%  { transform: translate3d(6vw, 5vh, 0) scale(1.15); }
    100% { transform: translate3d(-3vw, 9vh, 0) scale(0.95); }
`;

export const floatB = keyframes`
    0%   { transform: translate3d(0, 0, 0) scale(1.1); }
    50%  { transform: translate3d(-7vw, -6vh, 0) scale(0.9); }
    100% { transform: translate3d(4vw, -9vh, 0) scale(1.2); }
`;

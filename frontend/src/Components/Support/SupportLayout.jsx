import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RemoveIcon from '@mui/icons-material/Remove';
import { STORE } from '../../constants/storeInfo';
import { bodyText } from './supportStyles';


const TABS = {
    support: [
        { to: '/support/contact', label: 'Contact Us' },
        { to: '/support/shipping', label: 'Shipping' },
        { to: '/support/return', label: 'Return' },
        { to: '/support/faq', label: 'FAQ' },
    ],
    legal: [
        { to: '/terms', label: 'Terms of Service' },
        { to: '/privacy', label: 'Privacy Policy' },
    ],
};

// The frame every support / legal page sits in.
// Reuses the shop's .page-enter animation, so the header rises in first and the sections follow.
export function SupportPage({ group = 'support', eyebrow, title, intro, showHelp = true, children }) {
    const { pathname } = useLocation();

    return (
        <Box className="support-page page-enter" sx={{ maxWidth: 900, mx: 'auto', py: { xs: 2, md: 5 } }}>
            <Box component="header">
                <Typography
                    sx={{ fontSize: 12, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'secondary.main' }}
                >
                    {eyebrow}
                </Typography>
                <Typography
                    variant="h3"
                    component="h1"
                    sx={{ mt: 1, fontSize: { xs: 30, md: 40 }, fontWeight: 700, lineHeight: 1.15 }}
                >
                    {title}
                </Typography>
                {intro && <Typography sx={{ ...bodyText, mt: 2, maxWidth: 620, fontSize: 16 }}>{intro}</Typography>}

                <Box component="nav" aria-label="Help pages" className="support-nav" sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {TABS[group].map((tab) => {
                        const active = pathname === tab.to;
                        return (
                            <Chip
                                key={tab.to}
                                component={RouterLink}
                                to={tab.to}
                                clickable
                                label={tab.label}
                                variant={active ? 'filled' : 'outlined'}
                                color={active ? 'primary' : 'default'}
                            />
                        );
                    })}
                </Box>
            </Box>

            <Box className="support-body support-stagger" sx={{ mt: { xs: 5, md: 6 }, display: 'flex', flexDirection: 'column', gap: { xs: 5, md: 6 } }}>
                {children}
            </Box>

            {showHelp && <HelpStrip />}
        </Box>
    );
}

// A titled block of content
export function SupportSection({ title, children }) {
    return (
        <Box component="section">
            {title && (
                <Typography
                    component="h2"
                    sx={{ mb: 2, fontSize: 13, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#1a1a1a' }}
                >
                    {title}
                </Typography>
            )}
            {children}
        </Box>
    );
}

export function CardGrid({ columns = 3, children }) {
    return (
        <Box
            sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: `repeat(${columns}, minmax(0, 1fr))` },
            }}
        >
            {children}
        </Box>
    );
}

// A bordered card. Give it `to` (page) or `href` (mail / phone) and it becomes a link.
export function InfoCard({ icon, title, to, href, children }) {
    const isLink = Boolean(to || href);
    const linkProps = to ? { component: RouterLink, to } : href ? { component: 'a', href } : {};

    return (
        <Box
            {...linkProps}
            className={isLink ? 'support-card support-card-link' : 'support-card'}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                p: 3,
                border: '1px solid #ece9e4',
                borderRadius: '8px',
                bgcolor: '#fff',
                color: 'inherit',
                textDecoration: 'none',
            }}
        >
            <Box
                className="support-card-icon"
                sx={{ width: 44, height: 44, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: '#f1efeb', color: '#1a1a1a' }}
            >
                {icon}
            </Box>
            <Typography component="h3" sx={{ mt: 2, fontSize: 16, fontWeight: 700 }}>
                {title}
            </Typography>
            <Typography component="div" sx={{ mt: 0.5, fontSize: 14, lineHeight: 1.6, color: '#666' }}>
                {children}
            </Typography>
            {to && (
                <Box sx={{ mt: 'auto', pt: 2, display: 'flex' }}>
                    <ArrowForwardIcon className="support-card-arrow" sx={{ fontSize: 18, color: '#1a1a1a' }} />
                </Box>
            )}
        </Box>
    );
}

// Numbered steps joined by a thin line
export function Steps({ steps }) {
    return (
        <Box component="ol" className="support-steps" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {steps.map((step, index) => (
                <Box
                    component="li"
                    key={step.title}
                    sx={{ display: 'flex', gap: 2.5, pb: index === steps.length - 1 ? 0 : 3.5 }}
                >
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            flexShrink: 0,
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: 'primary.main',
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: 600,
                        }}
                    >
                        {index + 1}
                    </Box>
                    <Box sx={{ pt: 0.5 }}>
                        <Typography component="h3" sx={{ fontSize: 16, fontWeight: 700 }}>
                            {step.title}
                        </Typography>
                        <Typography sx={{ ...bodyText, mt: 0.5 }}>{step.body}</Typography>
                    </Box>
                </Box>
            ))}
        </Box>
    );
}

// Same look as the accordions on the product page (the .info-section styles in style.css)
export function SupportAccordion({ title, children }) {
    const [open, setOpen] = useState(false);

    return (
        <Accordion
            expanded={open}
            onChange={(e, isOpen) => setOpen(isOpen)}
            disableGutters
            elevation={0}
            square
            className="info-section"
        >
            <AccordionSummary expandIcon={open ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}>
                <Typography className="info-section-title" sx={{ textTransform: 'none !important', letterSpacing: '0 !important', fontWeight: 600 }}>
                    {title}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>{children}</AccordionDetails>
        </Accordion>
    );
}

export function AccordionList({ children, ...rest }) {
    return (
        <Box className="info-sections support-stagger" sx={{ '--base': '0s' }} {...rest}>
            {children}
        </Box>
    );
}

// "Still need help?" strip at the bottom of every page
function HelpStrip() {
    return (
        <Box
            className="support-help"
            sx={{
                mt: { xs: 6, md: 8 },
                p: { xs: 3, md: 4 },
                bgcolor: '#f7f7f7',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
            }}
        >
            <Box>
                <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Still need help?</Typography>
                <Typography sx={{ mt: 0.5, fontSize: 14, color: '#666' }}>
                    Message us and we'll reply {STORE.replyTime}.
                </Typography>
            </Box>
            <Button
                variant="contained"
                component={RouterLink}
                to="/support/contact"
                endIcon={<ArrowForwardIcon />}
                sx={{ flexShrink: 0 }}
            >
                Contact us
            </Button>
        </Box>
    );
}
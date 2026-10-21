// EXTRA · Support pages — contact, FAQ, shipping, return, terms and privacy content.
// Rendered by the /support/* and /terms, /privacy routes; uses SupportLayout.
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Chip, InputAdornment, TextField, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CheckroomOutlinedIcon from '@mui/icons-material/CheckroomOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutlineOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SearchIcon from '@mui/icons-material/Search';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined';
import { POLICY_UPDATED, RETURN_WINDOW_DAYS, STORE } from '../../constants/storeInfo';
import {
    AccordionList,
    CardGrid,
    InfoCard,
    Steps,
    SupportAccordion,
    SupportPage,
    SupportSection,
} from './SupportLayout';
import { bodyText } from './supportStyles';

const DAYS = RETURN_WINDOW_DAYS;

const Paragraph = ({ children, sx, ...rest }) => (
    <Typography sx={{ ...bodyText, '& + &': { mt: 1.5 }, ...sx }} {...rest}>
        {children}
    </Typography>
);

const InlineLink = ({ to, href, children }) => (
    <Box
        component={to ? RouterLink : 'a'}
        {...(to ? { to } : { href })}
        className="hover-underline"
        sx={{ color: 'inherit', fontWeight: 600, textDecoration: 'none' }}
    >
        {children}
    </Box>
);

// ---------------------------------------------------------------- Contact

export function ContactPage() {
    const mailto = `mailto:${STORE.email}?subject=${encodeURIComponent('OOTD support request')}`;

    return (
        <SupportPage
            eyebrow="Support"
            title="Contact us"
            intro={
                `Questions about an order, a size or a return? Send us a message and ` +
                `we'll get back to you ${STORE.replyTime}.`
            }
            showHelp={false}
        >
            <SupportSection title="Reach us">
                <CardGrid>
                    <InfoCard icon={<MailOutlineIcon />} title="Email" href={mailto}>
                        {STORE.email}
                    </InfoCard>
                    <InfoCard
                        icon={<PhoneOutlinedIcon />}
                        title="Phone"
                        href={`tel:${STORE.phone.replace(/\s/g, '')}`}
                    >
                        {STORE.phone}
                    </InfoCard>
                    <InfoCard icon={<ScheduleIcon />} title="Hours">
                        {STORE.hours}
                    </InfoCard>
                </CardGrid>
                <Button variant="contained" size="large" component="a" href={mailto} sx={{ mt: 3 }}>
                    Email us
                </Button>
            </SupportSection>

            <SupportSection title="Help us help you faster">
                <Paragraph>When you write to us, please include:</Paragraph>
                <Box component="ul" sx={{ ...bodyText, mt: 1, mb: 0, pl: 3 }}>
                    <li>Your order number. You can find it under My orders.</li>
                    <li>The item name, size and color you're asking about.</li>
                    <li>A clear photo if something arrived damaged or isn't what you ordered.</li>
                </Box>
            </SupportSection>

            <SupportSection title="Quick answers">
                <CardGrid>
                    <InfoCard
                        icon={<LocalShippingOutlinedIcon />}
                        title="Shipping"
                        to="/support/shipping"
                    >
                        Delivery times, tracking and payment on delivery.
                    </InfoCard>
                    <InfoCard
                        icon={<AssignmentReturnOutlinedIcon />}
                        title="Return"
                        to="/support/return"
                    >
                        How to return or exchange an item.
                    </InfoCard>
                    <InfoCard icon={<HelpOutlineIcon />} title="FAQ" to="/support/faq">
                        Answers to the questions we hear most.
                    </InfoCard>
                </CardGrid>
            </SupportSection>
        </SupportPage>
    );
}

// ---------------------------------------------------------------- Shipping

export function ShippingPage() {
    return (
        <SupportPage
            eyebrow="Support"
            title="Shipping & delivery"
            intro={
                'Free shipping on every order. Pay the courier when it arrives, ' +
                'or pay by card at checkout.'
            }
        >
            <SupportSection>
                <CardGrid>
                    <InfoCard icon={<LocalShippingOutlinedIcon />} title="Free shipping">
                        On every order, with no minimum spend.
                    </InfoCard>
                    <InfoCard icon={<PaymentsOutlinedIcon />} title="Pay your way">
                        Cash on delivery, or credit / debit card at checkout.
                    </InfoCard>
                    <InfoCard icon={<MarkEmailReadOutlinedIcon />} title="Email updates">
                        We email you when your order is placed, shipped and delivered.
                    </InfoCard>
                </CardGrid>
            </SupportSection>

            <SupportSection title="How your order moves">
                <Steps
                    steps={[
                        {
                            title: 'Processing',
                            body:
                                "We've received your order. You'll get a confirmation email " +
                                'with your PDF receipt while we pack it.',
                        },
                        {
                            title: 'Shipped',
                            body:
                                'Your order is with the courier and on its way. ' +
                                'We email you as soon as it ships.',
                        },
                        {
                            title: 'Delivered',
                            body:
                                'Your order has arrived. You can now review your items under My ' +
                                'orders.',
                        },
                    ]}
                />
                <Paragraph sx={{ mt: 3 }}>
                    You can check the current status of any order under{' '}
                    <InlineLink to="/orders/me">My orders</InlineLink>.
                </Paragraph>
            </SupportSection>

            <SupportSection title="Estimated delivery times">
                <Box sx={{ border: '1px solid #ece9e4', borderRadius: '8px', overflow: 'hidden' }}>
                    {[
                        ['Order processing', '1 to 2 business days'],
                        ['Metro Manila', '2 to 4 business days after shipping'],
                        ['Luzon, outside Metro Manila', '3 to 6 business days after shipping'],
                        ['Visayas and Mindanao', '5 to 9 business days after shipping'],
                    ].map(([place, time], index) => (
                        <Box
                            key={place}
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                justifyContent: 'space-between',
                                gap: 0.5,
                                px: 3,
                                py: 2,
                                fontSize: 15,
                                borderTop: index === 0 ? 'none' : '1px solid #ece9e4',
                            }}
                        >
                            <Box sx={{ fontWeight: 600 }}>{place}</Box>
                            <Box sx={{ color: '#666' }}>{time}</Box>
                        </Box>
                    ))}
                </Box>
                <Typography sx={{ mt: 1.5, fontSize: 13, color: '#777' }}>
                    These are estimates. Weather, holidays and courier volume can add a little time.
                </Typography>
            </SupportSection>

            <SupportSection title="Good to know">
                <AccordionList>
                    <SupportAccordion title="How do I track my order?">
                        <Paragraph>
                            Open <InlineLink to="/orders/me">My orders</InlineLink> to see the
                            status of every order. We also send you an email each time the status
                            changes.
                        </Paragraph>
                    </SupportAccordion>
                    <SupportAccordion title="How does cash on delivery work?">
                        <Paragraph>
                            Pay the courier in cash when your order arrives. Please have the exact
                            amount ready, since couriers don't always carry change.
                        </Paragraph>
                    </SupportAccordion>
                    <SupportAccordion title="I entered the wrong address">
                        <Paragraph>
                            Contact us right away. If your order hasn't shipped yet, we can update
                            the address. Once it has shipped, the address can't be changed.
                        </Paragraph>
                    </SupportAccordion>
                    <SupportAccordion title="What if I'm not home when the courier arrives?">
                        <Paragraph>
                            The courier will usually try again. If delivery keeps failing, the order
                            may be sent back to us and cancelled. Reach out to us and we'll help
                            arrange another delivery.
                        </Paragraph>
                    </SupportAccordion>
                    <SupportAccordion title="My order arrived damaged">
                        <Paragraph>
                            {"We're sorry about that. Send us a photo and your order number "}
                            {'within '}
                            {DAYS} days of delivery and we'll make it right. See{' '}
                            <InlineLink to="/support/return">Return</InlineLink> for details.
                        </Paragraph>
                    </SupportAccordion>
                </AccordionList>
            </SupportSection>
        </SupportPage>
    );
}

// ---------------------------------------------------------------- Return

const ELIGIBLE = [
    'Unworn, unwashed and unaltered, with tags still attached',
    'In the original packaging',
    'Requested within the return window',
    'Wrong, defective or damaged items, always',
];

const NOT_ELIGIBLE = [
    'Items that have been worn, washed or altered',
    'Items with missing tags or packaging',
    'Items marked final sale',
    'Requests made after the return window',
];

export function ReturnPage() {
    return (
        <SupportPage
            eyebrow="Support"
            title="Returns & refunds"
            intro={
                `Not the right fit? You have ${DAYS} days after delivery to ask for a ` +
                'return or an exchange.'
            }
        >
            <SupportSection>
                <CardGrid>
                    <InfoCard icon={<EventAvailableOutlinedIcon />} title={`${DAYS} days`}>
                        Starting from the day your order is delivered.
                    </InfoCard>
                    <InfoCard icon={<CheckroomOutlinedIcon />} title="Like new">
                        Unworn and unwashed, with the tags still on.
                    </InfoCard>
                    <InfoCard icon={<SwapHorizIcon />} title="Refund or exchange">
                        Your choice, depending on stock.
                    </InfoCard>
                </CardGrid>
            </SupportSection>

            <SupportSection title="How to return an item">
                <Steps
                    steps={[
                        {
                            title: 'Contact us',
                            body:
                                `Within ${DAYS} days of delivery, email us your order number, ` +
                                "the item you want to return and the reason. Add photos if it's " +
                                'damaged or wrong.',
                        },
                        {
                            title: 'We confirm',
                            body:
                                "We'll review your request and send you return instructions, " +
                                'usually within 1 to 2 business days.',
                        },
                        {
                            title: 'Send it back',
                            body:
                                'Pack the item with its tags and original packaging, and send ' +
                                'it back the way we tell you.',
                        },
                        {
                            title: 'Refund or exchange',
                            body:
                                "Once we've received and checked the item, we process your " +
                                'refund or send your exchange.',
                        },
                    ]}
                />
                <Box sx={{ mt: 3 }}>
                    <Button variant="outlined" component={RouterLink} to="/support/contact">
                        Start a return
                    </Button>
                </Box>
            </SupportSection>

            <SupportSection title="What can be returned">
                <Box
                    sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    }}
                >
                    {[
                        {
                            title: 'Eligible',
                            items: ELIGIBLE,
                            icon: <CheckIcon sx={{ fontSize: 18, color: '#2e7d32' }} />,
                        },
                        {
                            title: 'Not eligible',
                            items: NOT_ELIGIBLE,
                            icon: <CloseIcon sx={{ fontSize: 18, color: '#c62828' }} />,
                        },
                    ].map((group) => (
                        <Box
                            key={group.title}
                            sx={{ p: 3, border: '1px solid #ece9e4', borderRadius: '8px' }}
                        >
                            <Typography component="h3" sx={{ fontSize: 16, fontWeight: 700 }}>
                                {group.title}
                            </Typography>
                            <Box
                                component="ul"
                                sx={{
                                    listStyle: 'none',
                                    m: 0,
                                    mt: 2,
                                    p: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1.5,
                                }}
                            >
                                {group.items.map((item) => (
                                    <Box
                                        component="li"
                                        key={item}
                                        sx={{
                                            display: 'flex',
                                            gap: 1.25,
                                            fontSize: 14,
                                            lineHeight: 1.6,
                                            color: '#444',
                                        }}
                                    >
                                        <Box sx={{ pt: '2px', display: 'flex' }}>{group.icon}</Box>
                                        {item}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Box>
            </SupportSection>

            <SupportSection title="Refunds, exchanges and cancellations">
                <AccordionList>
                    <SupportAccordion title="How will I get my refund?">
                        <Paragraph>
                            Card payments are refunded to the card you paid with, usually within 5
                            to 10 business days after we receive your return. For cash on delivery
                            orders, we'll refund you by bank transfer or e-wallet. We'll ask for
                            your details when we confirm your return.
                        </Paragraph>
                    </SupportAccordion>
                    <SupportAccordion title="Can I exchange for a different size or color?">
                        <Paragraph>
                            Yes, as long as the size or color you want is in stock. If it isn't,
                            we'll refund you instead.
                        </Paragraph>
                    </SupportAccordion>
                    <SupportAccordion title="My item is damaged, defective or the wrong one">
                        <Paragraph>
                            Tell us within {DAYS} days of delivery with a photo and your order
                            number. We cover the return shipping and send a replacement or refund
                            you in full.
                        </Paragraph>
                    </SupportAccordion>
                    <SupportAccordion title="Who pays for return shipping?">
                        <Paragraph>
                            We do when the item is damaged, defective or wrong. If you're returning
                            an item because of fit or a change of mind, return shipping is on you.
                        </Paragraph>
                    </SupportAccordion>
                    <SupportAccordion title="Can I cancel an order?">
                        <Paragraph>
                            You can cancel while your order is still Processing. Contact us as soon
                            as you can and we'll cancel it and put the items back in stock. Once an
                            order has shipped, it can't be cancelled, but you can return it after
                            delivery.
                        </Paragraph>
                    </SupportAccordion>
                </AccordionList>
            </SupportSection>
        </SupportPage>
    );
}

// ---------------------------------------------------------------- FAQ

const FAQS = [
    {
        group: 'Orders & payment',
        q: 'Do I need an account to order?',
        a:
            "You can browse and add items to your cart without one, but you'll need to " +
            'sign in or create an account to check out. An account also lets you track ' +
            'orders and leave reviews.',
    },
    {
        group: 'Orders & payment',
        q: 'What payment methods do you accept?',
        a: 'We accept Cash on Delivery and credit / debit cards. You choose at checkout.',
    },
    {
        group: 'Orders & payment',
        q: 'Where can I find my receipt?',
        a:
            'We email you a confirmation with your PDF receipt when you place an order. ' +
            'Your orders are also listed under My orders.',
        more: { to: '/orders/me', label: 'My orders' },
    },
    {
        group: 'Orders & payment',
        q: 'Can I change or cancel my order?',
        a:
            "Yes, while it's still Processing. Contact us as soon as possible. Once an " +
            "order has shipped it can't be changed or cancelled.",
        more: { to: '/support/contact', label: 'Contact us' },
    },
    {
        group: 'Shipping & delivery',
        q: 'How much is shipping?',
        a: 'Shipping is free on every order.',
    },
    {
        group: 'Shipping & delivery',
        q: 'How long will my order take?',
        a:
            'Orders are processed in 1 to 2 business days. After that, delivery takes ' +
            'about 2 to 4 business days in Metro Manila and longer for other regions.',
        more: { to: '/support/shipping', label: 'Shipping & delivery' },
    },
    {
        group: 'Shipping & delivery',
        q: 'How do I track my order?',
        a:
            'Open My orders to see the current status. We also email you when your ' +
            'order ships and when it is delivered.',
        more: { to: '/orders/me', label: 'My orders' },
    },
    {
        group: 'Returns',
        q: "What's your return policy?",
        a:
            `You can return unworn, unwashed items with tags within ${DAYS} days of ` +
            'delivery for a refund or an exchange.',
        more: { to: '/support/return', label: 'Returns & refunds' },
    },
    {
        group: 'Returns',
        q: 'My item arrived damaged or is the wrong one. What now?',
        a:
            `Contact us within ${DAYS} days of delivery with your order number and a ` +
            "photo. We'll send a replacement or refund you in full.",
        more: { to: '/support/contact', label: 'Contact us' },
    },
    {
        group: 'Returns',
        q: 'How do refunds work?',
        a:
            'Card payments go back to your card in about 5 to 10 business days after ' +
            'we receive the return. Cash on delivery orders are refunded by bank ' +
            'transfer or e-wallet.',
    },
    {
        group: 'Products & account',
        q: "Why can't I pick a certain size or color?",
        a:
            'That combination is out of stock right now. Try another size or color, ' +
            'or check back later.',
    },
    {
        group: 'Products & account',
        q: 'How do I leave a review?',
        a:
            'Once your order is delivered, go to My orders and review each item you ' +
            'received. You can edit or delete your review later from the product page.',
        more: { to: '/orders/me', label: 'My orders' },
    },
    {
        group: 'Products & account',
        q: 'How do I update my profile or password?',
        a: 'Open My profile and choose to edit your details or change your password.',
        more: { to: '/me', label: 'My profile' },
    },
];

const FAQ_GROUPS = ['All', ...new Set(FAQS.map((item) => item.group))];

export function FaqPage() {
    const [group, setGroup] = useState('All');
    const [query, setQuery] = useState('');

    const visible = useMemo(() => {
        const text = query.trim().toLowerCase();
        return FAQS.filter(
            (item) =>
                (group === 'All' || item.group === group) &&
                (!text ||
                    item.q.toLowerCase().includes(text) ||
                    item.a.toLowerCase().includes(text)),
        );
    }, [group, query]);

    return (
        <SupportPage
            eyebrow="Support"
            title="Frequently asked questions"
            intro="Quick answers about orders, delivery, returns and your account."
        >
            <SupportSection>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search questions"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {FAQ_GROUPS.map((name) => (
                        <Chip
                            key={name}
                            label={name}
                            clickable
                            onClick={() => setGroup(name)}
                            variant={group === name ? 'filled' : 'outlined'}
                            color={group === name ? 'primary' : 'default'}
                        />
                    ))}
                </Box>
            </SupportSection>

            <SupportSection>
                {visible.length > 0 ? (
                    // The key makes the list rise in again each time the filter changes
                    <AccordionList key={`${group}-${query.trim()}`}>
                        {visible.map((item) => (
                            <SupportAccordion key={item.q} title={item.q}>
                                <Paragraph>{item.a}</Paragraph>
                                {item.more && (
                                    <Typography sx={{ ...bodyText, mt: 1.5 }}>
                                        <InlineLink to={item.more.to}>{item.more.label}</InlineLink>
                                    </Typography>
                                )}
                            </SupportAccordion>
                        ))}
                    </AccordionList>
                ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography sx={{ color: '#666' }}>
                            No questions match your search.
                        </Typography>
                        <Button
                            color="secondary"
                            sx={{ mt: 1 }}
                            onClick={() => {
                                setQuery('');
                                setGroup('All');
                            }}
                        >
                            Clear search
                        </Button>
                    </Box>
                )}
            </SupportSection>
        </SupportPage>
    );
}

// ---------------------------------------------------------------- Terms & Privacy

function LegalPage({ title, intro, sections }) {
    return (
        <SupportPage group="legal" eyebrow="Legal" title={title} intro={intro} showHelp={false}>
            <Typography sx={{ fontSize: 13, color: '#777', mt: -3 }}>
                Last updated {POLICY_UPDATED}
            </Typography>
            {sections.map((section, index) => (
                <SupportSection key={section.title} title={`${index + 1}. ${section.title}`}>
                    {section.paragraphs?.map((text) => (
                        <Paragraph key={text}>{text}</Paragraph>
                    ))}
                    {section.bullets && (
                        <Box
                            component="ul"
                            sx={{ ...bodyText, mt: section.paragraphs ? 1.5 : 0, mb: 0, pl: 3 }}
                        >
                            {section.bullets.map((text) => (
                                <li key={text}>{text}</li>
                            ))}
                        </Box>
                    )}
                    {section.links && (
                        <Typography sx={{ ...bodyText, mt: 1.5 }}>
                            {section.links.map((link, i) => (
                                <span key={link.to}>
                                    {i > 0 && ' · '}
                                    <InlineLink to={link.to}>{link.label}</InlineLink>
                                </span>
                            ))}
                        </Typography>
                    )}
                </SupportSection>
            ))}
        </SupportPage>
    );
}

export function TermsPage() {
    return (
        <LegalPage
            title="Terms of Service"
            intro={
                'The ground rules for using OOTD and buying from us. Please read ' +
                'them before you place an order.'
            }
            sections={[
                {
                    title: 'Using OOTD',
                    paragraphs: [
                        'By browsing our site or placing an order, you agree to these terms. ' +
                            "If you don't agree, please don't use the site.",
                    ],
                },
                {
                    title: 'Your account',
                    paragraphs: [
                        'You need an account to check out. Keep your details accurate ' +
                            "and your login private. You're responsible for everything that " +
                            'happens under your account. We may suspend accounts that are ' +
                            'used to abuse the store.',
                    ],
                },
                {
                    title: 'Products and prices',
                    paragraphs: [
                        'We do our best to show colors, sizes and details accurately, ' +
                            'but screens differ, so colors may look slightly different in person.',
                        'All prices are in Philippine pesos (₱). If we spot a pricing ' +
                            'or stock error, we may cancel the affected order and refund ' +
                            'you in full.',
                    ],
                },
                {
                    title: 'Orders and payment',
                    paragraphs: [
                        'Your order is confirmed when we send you a confirmation email. ' +
                            'You can pay by cash on delivery or by credit / debit card.',
                        'For cash on delivery, please pay the courier the full amount ' +
                            'when your order arrives. We may limit cash on delivery for ' +
                            'accounts with repeated refused deliveries.',
                    ],
                },
                {
                    title: 'Shipping, returns and refunds',
                    paragraphs: [
                        'How we deliver, and how returns and refunds work, is explained ' +
                            'on these pages and forms part of these terms.',
                    ],
                    links: [
                        { to: '/support/shipping', label: 'Shipping' },
                        { to: '/support/return', label: 'Return' },
                    ],
                },
                {
                    title: 'Reviews',
                    paragraphs: [
                        'Reviews should be honest and respectful. We may remove reviews ' +
                            'that contain abusive language, spam or personal information. ' +
                            'You keep ownership of what you write, and you let us display ' +
                            'it on the store.',
                    ],
                },
                {
                    title: 'Acceptable use',
                    paragraphs: ['Please do not:'],
                    bullets: [
                        'Try to break into, overload or interfere with the site',
                        'Copy or scrape our content without permission',
                        'Use the site for fraud or anything illegal',
                    ],
                },
                {
                    title: 'Our content',
                    paragraphs: [
                        'The OOTD name, logo, photos, text and designs belong to us or ' +
                            'our licensors. You may not use them without our written permission.',
                    ],
                },
                {
                    title: 'Limits of liability',
                    paragraphs: [
                        'We provide the site as it is. To the extent the law allows, we ' +
                            'are not liable for indirect or consequential losses. Nothing in ' +
                            'these terms limits any rights you have under Philippine consumer ' +
                            'laws.',
                    ],
                },
                {
                    title: 'Changes to these terms',
                    paragraphs: [
                        'We may update these terms from time to time. The date at the top ' +
                            'shows when they last changed. If you keep using the site after an ' +
                            'update, you accept the new terms.',
                    ],
                },
                {
                    title: 'Governing law',
                    paragraphs: [
                        'These terms are governed by the laws of the Republic of the Philippines.',
                    ],
                },
                {
                    title: 'Contact',
                    paragraphs: [`Questions about these terms? Email us at ${STORE.email}.`],
                    links: [{ to: '/support/contact', label: 'Contact us' }],
                },
            ]}
        />
    );
}

export function PrivacyPage() {
    return (
        <LegalPage
            title="Privacy Policy"
            intro={
                'What we collect, why we collect it and the choices you have. We ' +
                "handle your personal data in line with the Philippines' Data Privacy " +
                'Act of 2012.'
            }
            sections={[
                {
                    title: 'What we collect',
                    bullets: [
                        'Account details: your name, email address and profile photo if ' +
                            'you add one',
                        'Delivery details: the name, address and phone number you enter ' +
                            'at checkout',
                        'Order details: the items you buy, totals, payment method and order status',
                        'Reviews you write',
                        'Basic technical data, such as your browser and device, and what ' +
                            'you do on the site',
                    ],
                },
                {
                    title: 'How we use it',
                    bullets: [
                        'To create your account and sign you in',
                        'To process, deliver and support your orders',
                        'To email you order confirmations, receipts and status updates',
                        'To show reviews and improve the store',
                        'To keep the site secure and prevent fraud',
                    ],
                },
                {
                    title: 'Card payments',
                    paragraphs: ['We do not keep your card number or CVC on our servers.'],
                },
                {
                    title: 'Who we share it with',
                    paragraphs: [
                        'We do not sell your personal data. We share only what is needed ' +
                            'with the services that help us run the store, such as sign-in, ' +
                            'image hosting, email delivery and couriers, and only so they can ' +
                            'do their job.',
                        'We may also share data when the law requires it.',
                    ],
                },
                {
                    title: 'Cookies and storage',
                    paragraphs: [
                        'We use cookies and local storage on your device to keep you ' +
                            'signed in and to remember your cart. The site needs these to ' +
                            'work properly.',
                    ],
                },
                {
                    title: 'How long we keep it',
                    paragraphs: [
                        'We keep your data for as long as your account is open and as ' +
                            'long as we need it for orders, returns and legal or accounting ' +
                            'purposes.',
                    ],
                },
                {
                    title: 'Your rights',
                    paragraphs: ['You can ask us to:'],
                    bullets: [
                        'Show you the personal data we hold about you',
                        'Correct anything that is wrong or out of date',
                        'Delete your account and data, where the law allows',
                    ],
                },
                {
                    title: 'Changes to this policy',
                    paragraphs: [
                        'If we change this policy, we will update the date at the top of ' +
                            'this page.',
                    ],
                },
                {
                    title: 'Contact',
                    paragraphs: [
                        `To use any of these rights or to ask a question, email us at ` +
                            `${STORE.email}.`,
                    ],
                    links: [{ to: '/support/contact', label: 'Contact us' }],
                },
            ]}
        />
    );
}

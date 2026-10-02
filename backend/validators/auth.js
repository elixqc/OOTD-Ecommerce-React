const { z } = require('zod');

exports.registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name cannot exceed 50 characters'),
    phone: z.string().trim().max(20, 'Phone number is too long').optional(),
    avatar: z
        .string()
        .refine((v) => v.startsWith('data:image/'), 'Avatar must be an image')
        .refine((v) => v.length <= 3000000, 'Avatar is too large (max about 2 MB)')
        .optional(),
});
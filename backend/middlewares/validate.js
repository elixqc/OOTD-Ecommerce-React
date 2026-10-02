// Validates req.body against a Zod schema before the controller runs
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error.issues.map((issue) => issue.message).join(', '),
        });
    }

    req.body = result.data;
    next();
};

module.exports = validate;
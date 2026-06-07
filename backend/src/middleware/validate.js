const { ZodError } = require('zod');

const validate = (schemas) => (req, res, next) => {
    try {
        const data = {};
        if (schemas.body) data.body = schemas.body.parse(req.body);
        if (schemas.query) data.query = schemas.query.parse(req.query);
        if (schemas.params) data.params = schemas.params.parse(req.params);
        if (data.body) req.body = data.body;
        if (data.query) req.validatedQuery = data.query;
        if (data.params) req.params = data.params;
        next();
    } catch (err) {
        if (err instanceof ZodError) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: err.issues.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        next(err);
    }
};

module.exports = validate;

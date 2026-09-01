export const wrapMiddleware = (func) => {
    return (req, res, next) => {
        func(req, res).then(() => next()).catch(next);
    };
};
export const wrapController = (func) => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    };
};
export const validateRequest = (schema) => {
    return wrapMiddleware(async (req) => {
        const { body, query, params } = req;
        const validated = await schema.parseAsync({ body, query, params });
        req.body = validated.body;
        req.query = validated.query;
        req.params = validated.params;
    });
};
//# sourceMappingURL=wrappers.js.map
// Error handling
export { ServiceError, UserNotFoundError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, } from "./errors.js";
// Authentication
export { authenticateJWT } from "./auth.js";
// Zod utilities
export { zodMongoObjectId, parseZod, safeParseZod, } from "./zod.js";
// Express utilities
export { errorMiddleware } from "./express/error.js";
export { wrapMiddleware, wrapController, validateRequest } from "./express/wrappers.js";
// Logger utilities
export { logger } from "./logger/index.js";
export { loggerMiddleware } from "./logger/middleware.js";
// Database utilities
export { transaction } from "./db/mongoose.js";
// Common helpers
export const toErrorMessage = (error) => {
    if (error instanceof Error) {
        return error.message;
    }
    return "Unexpected error";
};
export const formatCurrency = (amount, currency = "ILS") => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
}).format(amount);
export const isTruthy = (value) => Boolean(value);
//# sourceMappingURL=index.js.map
export { ServiceError, UserNotFoundError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, } from "./errors.js";
export { authenticateJWT, type AuthenticatedRequest } from "./auth.js";
export type { Prettify } from "./types.js";
export { zodMongoObjectId, type TypedRequest, parseZod, safeParseZod, } from "./zod.js";
export { errorMiddleware } from "./express/error.js";
export { wrapMiddleware, wrapController, validateRequest } from "./express/wrappers.js";
export { logger } from "./logger/index.js";
export { loggerMiddleware } from "./logger/middleware.js";
export { transaction } from "./db/mongoose.js";
export declare const toErrorMessage: (error: unknown) => string;
export declare const formatCurrency: (amount: number, currency?: string) => string;
export declare const isTruthy: (value: unknown) => boolean;
//# sourceMappingURL=index.d.ts.map